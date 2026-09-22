package com.ktebna.backend.api;

import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.request.MockMultipartHttpServletRequestBuilder;

import java.util.HashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class LibraryApiTest extends ApiTestBase {

    private MockMultipartHttpServletRequestBuilder share(Account sharer, Map<String, String> fields) {
        MockMultipartHttpServletRequestBuilder req = multipart("/api/library");
        req.file(new MockMultipartFile("image", "cover.jpg", "image/jpeg", JPEG));
        fields.forEach(req::param);
        req.header("Authorization", sharer.bearer());
        return req;
    }

    private JsonNode shareBook(Account sharer, String title, String language, Map<String, String> extra) throws Exception {
        Map<String, String> fields = new HashMap<>(Map.of(
                "title", title,
                "author", "Victor Hugo",
                "language", language,
                "category", "Classics",
                "pdfUrl", "https://example.org/book.pdf"));
        fields.putAll(extra);
        return body(mvc.perform(share(sharer, fields)).andExpect(status().isOk()));
    }

    @Test
    void sharedBooksAppearInThePublicLibraryWithTheirSharer() throws Exception {
        Account sharer = register("Sharer");
        String title = unique("Les Miserables");
        JsonNode book = shareBook(sharer, title, "fr", Map.of("description", "Tome 1"));

        assertThat(book.path("coverImage").asText()).startsWith("/uploads/");
        assertThat(book.path("user").path("name").asText()).isEqualTo("Sharer");
        assertThat(book.path("user").path("email").isNull()).isTrue();

        mvc.perform(get("/api/library").param("search", title))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.count").value(1))
                .andExpect(jsonPath("$.data[0].pdfUrl").value("https://example.org/book.pdf"))
                .andExpect(jsonPath("$.data[0].user.email").doesNotExist());
        mvc.perform(get("/api/library/" + book.path("id").asLong()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.description").value("Tome 1"));
    }

    @Test
    void libraryFiltersByLanguageAndCategory() throws Exception {
        Account sharer = register("Sharer");
        String marker = unique("Filter");
        shareBook(sharer, marker + " fr", "fr", Map.of());
        shareBook(sharer, marker + " ar", "ar", Map.of("category", "Biography"));

        mvc.perform(get("/api/library").param("search", marker).param("language", "ar"))
                .andExpect(jsonPath("$.count").value(1));
        mvc.perform(get("/api/library").param("search", marker).param("category", "Classics"))
                .andExpect(jsonPath("$.count").value(1));
        mvc.perform(get("/api/library").param("search", marker).param("language", "All"))
                .andExpect(jsonPath("$.count").value(2));
    }

    @Test
    void sharingRequiresLogin() throws Exception {
        mvc.perform(multipart("/api/library").param("title", "x").param("language", "en")
                        .param("pdfUrl", "https://example.org/x.pdf"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void onlyHttpLinksAndKnownLanguagesAreAccepted() throws Exception {
        Account sharer = register("Sharer");
        Map<String, String> ok = Map.of("title", "Book", "language", "en", "pdfUrl", "https://example.org/b.pdf");

        Map<String, String> scriptLink = new HashMap<>(ok);
        scriptLink.put("pdfUrl", "javascript:alert(1)");
        mvc.perform(share(sharer, scriptLink)).andExpect(status().isBadRequest());

        Map<String, String> badLanguage = new HashMap<>(ok);
        badLanguage.put("language", "de");
        mvc.perform(share(sharer, badLanguage)).andExpect(status().isBadRequest());

        Map<String, String> noLink = new HashMap<>(ok);
        noLink.remove("pdfUrl");
        mvc.perform(share(sharer, noLink)).andExpect(status().isBadRequest());
    }

    @Test
    void onlyTheSharerCanRemoveABook() throws Exception {
        Account sharer = register("Sharer");
        Account stranger = register("Stranger");
        long id = shareBook(sharer, unique("Keep"), "en", Map.of()).path("id").asLong();

        mvc.perform(as(stranger, delete("/api/library/" + id))).andExpect(status().isForbidden());
        mvc.perform(as(sharer, delete("/api/library/" + id))).andExpect(status().isOk());
        mvc.perform(get("/api/library/" + id)).andExpect(status().isNotFound());
    }

    @Test
    void deletingAnAccountRemovesTheBooksItShared() throws Exception {
        Account leaving = register("Leaving");
        long id = shareBook(leaving, unique("Gone"), "en", Map.of()).path("id").asLong();

        mvc.perform(as(leaving, delete("/api/account"))).andExpect(status().isOk());
        mvc.perform(get("/api/library/" + id)).andExpect(status().isNotFound());
    }
}
