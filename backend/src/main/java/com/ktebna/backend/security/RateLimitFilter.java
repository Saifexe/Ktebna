package com.ktebna.backend.security;

import com.ktebna.backend.entity.User;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.lang.NonNull;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.net.InetAddress;
import java.net.UnknownHostException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Fixed-window rate limits on the endpoints worth abusing: login (password
 * guessing), register (account spam), and sending messages, listings or
 * library books (spam).
 * In-memory, so limits are per backend instance; that matches the single-replica
 * deployments in docker-compose.yml and k8s/.
 *
 * Not a Spring bean on purpose: it's added to the security chain in SecurityConfig
 * and would otherwise also be auto-registered as a second servlet filter.
 */
public class RateLimitFilter extends OncePerRequestFilter {

    private record Rule(String method, String path, int limit, long windowMs, boolean perUser) {
    }

    private static final List<Rule> RULES = List.of(
            new Rule("POST", "/api/auth/login", 10, 60_000, false),
            new Rule("POST", "/api/auth/register", 5, 60_000, false),
            new Rule("POST", "/api/messages", 30, 60_000, true),
            new Rule("POST", "/api/posts", 10, 60_000, true),
            new Rule("POST", "/api/library", 10, 60_000, true)
    );

    private static final class Window {
        final long start;
        int count;

        Window(long start) {
            this.start = start;
        }
    }

    private final Map<String, Window> windows = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain chain) throws ServletException, IOException {
        Rule rule = RULES.stream()
                .filter(r -> r.method().equals(request.getMethod()) && r.path().equals(request.getRequestURI()))
                .findFirst().orElse(null);
        if (rule == null) {
            chain.doFilter(request, response);
            return;
        }

        String key = rule.path() + "|" + (rule.perUser() ? callerId(request) : clientIp(request));
        long now = System.currentTimeMillis();
        if (windows.size() > 10_000) {
            windows.values().removeIf(w -> now - w.start > 60_000);
        }

        Window window = windows.compute(key, (k, w) -> (w == null || now - w.start >= rule.windowMs()) ? new Window(now) : w);
        int count;
        synchronized (window) {
            count = ++window.count;
        }
        if (count > rule.limit()) {
            long retryAfter = Math.max(1, (window.start + rule.windowMs() - now) / 1000);
            response.setStatus(429);
            response.setHeader("Retry-After", String.valueOf(retryAfter));
            response.setContentType("application/json");
            response.getWriter().write("{\"error\":\"Too many requests. Please wait a minute and try again.\"}");
            return;
        }
        chain.doFilter(request, response);
    }

    private String callerId(HttpServletRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof User user) {
            return "user:" + user.getId();
        }
        return "ip:" + clientIp(request);
    }

    // Trust X-Real-IP only when the request came through a local/private proxy
    // (our nginx); otherwise a client could spoof it to dodge the limit.
    private String clientIp(HttpServletRequest request) {
        String remote = request.getRemoteAddr();
        String forwarded = request.getHeader("X-Real-IP");
        if (forwarded != null && !forwarded.isBlank() && isPrivate(remote)) {
            return forwarded.trim();
        }
        return remote;
    }

    private boolean isPrivate(String address) {
        try {
            InetAddress ip = InetAddress.getByName(address);
            return ip.isLoopbackAddress() || ip.isSiteLocalAddress() || ip.isLinkLocalAddress();
        } catch (UnknownHostException e) {
            return false;
        }
    }
}
