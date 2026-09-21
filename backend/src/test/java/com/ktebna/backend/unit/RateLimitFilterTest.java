package com.ktebna.backend.unit;

import com.ktebna.backend.entity.User;
import com.ktebna.backend.security.RateLimitFilter;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Collections;

import static org.assertj.core.api.Assertions.assertThat;

class RateLimitFilterTest {

    private final RateLimitFilter filter = new RateLimitFilter();

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    private int call(String method, String path, String remoteAddr, String realIp) throws Exception {
        MockHttpServletRequest req = new MockHttpServletRequest(method, path);
        req.setRemoteAddr(remoteAddr);
        if (realIp != null) {
            req.addHeader("X-Real-IP", realIp);
        }
        MockHttpServletResponse res = new MockHttpServletResponse();
        filter.doFilter(req, res, new MockFilterChain());
        return res.getStatus();
    }

    private int login(String remoteAddr) throws Exception {
        return call("POST", "/api/auth/login", remoteAddr, null);
    }

    @Test
    void allowsTenLoginsPerMinuteThenAnswers429WithRetryAfter() throws Exception {
        for (int i = 0; i < 10; i++) {
            assertThat(login("203.0.113.7")).isEqualTo(200);
        }
        MockHttpServletRequest req = new MockHttpServletRequest("POST", "/api/auth/login");
        req.setRemoteAddr("203.0.113.7");
        MockHttpServletResponse res = new MockHttpServletResponse();
        filter.doFilter(req, res, new MockFilterChain());

        assertThat(res.getStatus()).isEqualTo(429);
        assertThat(res.getHeader("Retry-After")).isNotBlank();
        assertThat(res.getContentAsString()).contains("Too many requests");
    }

    @Test
    void limitsAreTrackedPerClient() throws Exception {
        for (int i = 0; i < 10; i++) {
            login("203.0.113.7");
        }
        assertThat(login("203.0.113.7")).isEqualTo(429);
        assertThat(login("198.51.100.20")).isEqualTo(200);
    }

    @Test
    void registrationIsCappedAtFivePerMinute() throws Exception {
        for (int i = 0; i < 5; i++) {
            assertThat(call("POST", "/api/auth/register", "203.0.113.9", null)).isEqualTo(200);
        }
        assertThat(call("POST", "/api/auth/register", "203.0.113.9", null)).isEqualTo(429);
    }

    @Test
    void trustsXRealIpOnlyFromAPrivateProxy() throws Exception {
        // Behind our nginx (private address) each real client gets its own bucket...
        for (int i = 0; i < 10; i++) {
            call("POST", "/api/auth/login", "172.18.0.5", "203.0.113.50");
        }
        assertThat(call("POST", "/api/auth/login", "172.18.0.5", "203.0.113.50")).isEqualTo(429);
        assertThat(call("POST", "/api/auth/login", "172.18.0.5", "203.0.113.51")).isEqualTo(200);

        // ...but a public client can't dodge its limit by forging the header.
        for (int i = 0; i < 10; i++) {
            call("POST", "/api/auth/login", "198.51.100.99", "10.0.0." + i);
        }
        assertThat(call("POST", "/api/auth/login", "198.51.100.99", "10.0.0.200")).isEqualTo(429);
    }

    @Test
    void messageLimitIsPerUserNotPerAddress() throws Exception {
        User alice = new User();
        alice.setId(1L);
        User bob = new User();
        bob.setId(2L);

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(alice, null, Collections.emptyList()));
        for (int i = 0; i < 30; i++) {
            assertThat(call("POST", "/api/messages", "172.18.0.5", null)).isEqualTo(200);
        }
        assertThat(call("POST", "/api/messages", "172.18.0.5", null)).isEqualTo(429);

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(bob, null, Collections.emptyList()));
        assertThat(call("POST", "/api/messages", "172.18.0.5", null)).isEqualTo(200);
    }

    @Test
    void otherEndpointsAreNotLimited() throws Exception {
        for (int i = 0; i < 100; i++) {
            assertThat(call("GET", "/api/posts", "203.0.113.7", null)).isEqualTo(200);
        }
        assertThat(call("GET", "/api/auth/login", "203.0.113.7", null)).isEqualTo(200);
    }
}
