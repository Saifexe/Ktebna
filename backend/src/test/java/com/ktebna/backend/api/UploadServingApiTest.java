package com.ktebna.backend.api;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// /uploads/ serves what was stored, to anyone (covers are public), and nothing else.
class UploadServingApiTest extends ApiTestBase {

    @Test
    void anUploadedCoverIsServedWithItsTypeAndCanBeRevalidated() throws Exception {
        Account seller = register("Cover");
        String url = createPost(seller, unique("Cover")).path("bookImage").asText();

        var response = mvc.perform(get(url))
                .andExpect(status().isOk())
                .andExpect(content().contentType("image/jpeg"))
                .andExpect(header().exists(HttpHeaders.LAST_MODIFIED))
                .andReturn().getResponse();
        assertThat(response.getContentAsByteArray()).startsWith((byte) 0xFF, (byte) 0xD8);

        // A browser re-checking its cached copy gets a 304 without the image.
        mvc.perform(get(url).header(HttpHeaders.IF_MODIFIED_SINCE, response.getHeader(HttpHeaders.LAST_MODIFIED)))
                .andExpect(status().isNotModified());
    }

    @Test
    void unknownOrForeignNamesAre404() throws Exception {
        mvc.perform(get("/uploads/00000000-0000-0000-0000-000000000000.jpg")).andExpect(status().isNotFound());
        mvc.perform(get("/uploads/application.properties")).andExpect(status().isNotFound());
    }
}
