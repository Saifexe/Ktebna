package com.ktebna.backend.api;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Value;

import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.Map;

import static org.hamcrest.Matchers.emptyOrNullString;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AuthApiTest extends ApiTestBase {

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    @Test
    void registerReturnsATokenThatAuthenticatesMe() throws Exception {
        Account amira = register("Amira");

        mvc.perform(as(amira, get("/api/auth/me")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(amira.id()))
                .andExpect(jsonPath("$.name").value("Amira"))
                .andExpect(jsonPath("$.email").value(amira.email()));
    }

    @Test
    void registeringTheSameEmailTwiceIsAConflict() throws Exception {
        Account first = register("First");

        mvc.perform(jsonBody(post("/api/auth/register"), Map.of("name", "Copy", "email", first.email(), "password", "secret123")))
                .andExpect(status().isConflict());
    }

    @Test
    void emailsAreCaseInsensitive() throws Exception {
        Account user = register("Case");

        mvc.perform(jsonBody(post("/api/auth/login"), Map.of("email", user.email().toUpperCase(), "password", "secret123")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token", not(emptyOrNullString())));
        mvc.perform(jsonBody(post("/api/auth/register"), Map.of("name", "Dup", "email", user.email().toUpperCase(), "password", "secret123")))
                .andExpect(status().isConflict());
    }

    @Test
    void registrationValidatesInput() throws Exception {
        mvc.perform(jsonBody(post("/api/auth/register"), Map.of("name", "Bad", "email", "not-an-email", "password", "secret123")))
                .andExpect(status().isBadRequest());
        mvc.perform(jsonBody(post("/api/auth/register"), Map.of("name", "Bad", "email", unique("short") + "@example.test", "password", "123")))
                .andExpect(status().isBadRequest());
    }

    @Test
    void wrongPasswordAndUnknownEmailGetTheSameAnswer() throws Exception {
        Account user = register("Login");

        mvc.perform(jsonBody(post("/api/auth/login"), Map.of("email", user.email(), "password", "wrong-password")))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Invalid email or password"));
        mvc.perform(jsonBody(post("/api/auth/login"), Map.of("email", unique("ghost") + "@example.test", "password", "wrong-password")))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Invalid email or password"));
    }

    @Test
    void protectedEndpointsAnswer401WithoutAValidToken() throws Exception {
        mvc.perform(get("/api/auth/me")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/saved-posts"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Authentication required"));
        mvc.perform(get("/api/saved-posts").header("Authorization", "Bearer forged.token.value"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void expiredTokenIsA401SoTheFrontendLogsTheUserOut() throws Exception {
        // Regression: this used to be 403, which the frontend doesn't treat as "logged out".
        Account user = register("Expired");
        Date past = new Date(System.currentTimeMillis() - 60_000);
        String expired = Jwts.builder()
                .subject(String.valueOf(user.id()))
                .issuedAt(new Date(past.getTime() - 60_000))
                .expiration(past)
                .signWith(Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8)))
                .compact();

        mvc.perform(get("/api/saved-posts").header("Authorization", "Bearer " + expired))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void passwordHashIsNeverReturned() throws Exception {
        Account user = register("Hash");

        mvc.perform(as(user, get("/api/auth/me")))
                .andExpect(jsonPath("$.password").doesNotExist());
    }
}
