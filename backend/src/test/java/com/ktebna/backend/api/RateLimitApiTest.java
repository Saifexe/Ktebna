package com.ktebna.backend.api;

import org.junit.jupiter.api.Test;
import org.springframework.test.context.TestPropertySource;

import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** The limiter is wired into the real security chain when enabled (the default). */
@TestPropertySource(properties = "app.rate-limit.enabled=true")
class RateLimitApiTest extends ApiTestBase {

    @Test
    void bruteForceLoginGets429AfterTenAttempts() throws Exception {
        Map<String, String> wrong = Map.of("email", unique("victim") + "@example.test", "password", "guess");
        for (int i = 0; i < 10; i++) {
            mvc.perform(jsonBody(post("/api/auth/login"), wrong).with(r -> { r.setRemoteAddr("203.0.113.77"); return r; }))
                    .andExpect(status().isUnauthorized());
        }
        mvc.perform(jsonBody(post("/api/auth/login"), wrong).with(r -> { r.setRemoteAddr("203.0.113.77"); return r; }))
                .andExpect(status().isTooManyRequests())
                .andExpect(header().exists("Retry-After"));
    }
}
