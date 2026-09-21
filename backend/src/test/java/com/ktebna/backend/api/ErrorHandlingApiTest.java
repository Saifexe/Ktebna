package com.ktebna.backend.api;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ErrorHandlingApiTest extends ApiTestBase {

    private static void assertNoInternals(String body) {
        assertThat(body.toLowerCase())
                .doesNotContain("exception")
                .doesNotContain("java.")
                .doesNotContain("sql")
                .doesNotContain("hibernate")
                .doesNotContain("at com.");
    }

    @Test
    void malformedIdIsA400WithAGenericMessage() throws Exception {
        String body = mvc.perform(get("/api/posts/not-a-number"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Malformed request"))
                .andReturn().getResponse().getContentAsString();
        assertNoInternals(body);
    }

    @Test
    void unreadableJsonIsA400() throws Exception {
        String body = mvc.perform(post("/api/auth/login").contentType("application/json").content("{not json"))
                .andExpect(status().isBadRequest())
                .andReturn().getResponse().getContentAsString();
        assertNoInternals(body);
    }

    @Test
    void missingListingIsA404() throws Exception {
        mvc.perform(get("/api/posts/987654321"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("Post not found"));
    }

    @Test
    void healthEndpointIsPublic() throws Exception {
        mvc.perform(get("/actuator/health")).andExpect(status().isOk());
    }
}
