package com.ktebna.backend.api;

import com.ktebna.backend.security.JwtUtil;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.test.util.ReflectionTestUtils;

import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class SessionApiTest extends ApiTestBase {

    @Value("${app.jwt.secret}")
    private String secret;

    private Account login(Account account) throws Exception {
        String token = body(mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("email", account.email(), "password", "secret123"))))
                .andExpect(status().isOk())).path("token").asText();
        return new Account(account.id(), account.email(), token);
    }

    @Test
    void logOutEverywhereRevokesEveryTokenTheUserHolds() throws Exception {
        Account phone = register("Revoke");
        Account laptop = login(phone);
        Account bystander = register("Bystander");

        mvc.perform(as(laptop, post("/api/auth/logout-everywhere"))).andExpect(status().isOk());

        mvc.perform(as(phone, get("/api/auth/me"))).andExpect(status().isUnauthorized());
        mvc.perform(as(laptop, get("/api/auth/me"))).andExpect(status().isUnauthorized());
        // Other people's sessions are untouched, and logging in again works.
        mvc.perform(as(bystander, get("/api/auth/me"))).andExpect(status().isOk());
        mvc.perform(as(login(phone), get("/api/auth/me")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(phone.id()));
    }

    @Test
    void logOutEverywhereNeedsALogin() throws Exception {
        mvc.perform(post("/api/auth/logout-everywhere")).andExpect(status().isUnauthorized());
    }

    @Test
    void tokensIssuedBeforeVersioningStillWorkUntilTheFirstRevocation() throws Exception {
        // Deploying this must not log everyone out: older tokens have no "ver" claim.
        Account reader = register("Legacy");
        String legacy = Jwts.builder()
                .subject(String.valueOf(reader.id()))
                .claim("email", reader.email())
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + 60_000))
                .signWith(Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8)))
                .compact();
        Account oldSession = new Account(reader.id(), reader.email(), legacy);

        mvc.perform(as(oldSession, get("/api/auth/me"))).andExpect(status().isOk());
        mvc.perform(as(reader, post("/api/auth/logout-everywhere"))).andExpect(status().isOk());
        mvc.perform(as(oldSession, get("/api/auth/me"))).andExpect(status().isUnauthorized());
    }

    @Test
    void theVersionTravelsInsideTheSignedToken() {
        JwtUtil util = new JwtUtil();
        ReflectionTestUtils.setField(util, "secret", secret);
        ReflectionTestUtils.setField(util, "expirationMs", 60_000L);
        String token = util.generateToken(7L, "x@example.test", 3);

        assertThat(JwtUtil.versionOf(util.parse(token))).isEqualTo(3);
        assertThat(util.parse("not.a.jwt")).isNull();
    }
}
