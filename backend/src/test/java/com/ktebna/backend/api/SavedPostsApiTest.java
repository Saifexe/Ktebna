package com.ktebna.backend.api;

import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class SavedPostsApiTest extends ApiTestBase {

    @Test
    void saveAndUnsave() throws Exception {
        Account seller = register("Seller");
        Account reader = register("Reader");
        long id = createPost(seller, unique("Keep")).path("id").asLong();

        mvc.perform(as(reader, post("/api/saved-posts/" + id))).andExpect(status().isOk());
        mvc.perform(as(reader, post("/api/saved-posts/" + id))).andExpect(status().isOk()); // idempotent
        mvc.perform(as(reader, get("/api/saved-posts/ids"))).andExpect(jsonPath("$", contains((int) id)));
        mvc.perform(as(reader, get("/api/saved-posts"))).andExpect(jsonPath("$.count").value(1));

        mvc.perform(as(reader, delete("/api/saved-posts/" + id))).andExpect(status().isOk());
        mvc.perform(as(reader, get("/api/saved-posts/ids"))).andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    void shelfIsCappedAtSixBooks() throws Exception {
        Account seller = register("Seller");
        Account reader = register("Collector");
        for (int i = 0; i < 6; i++) {
            long id = createPost(seller, unique("Book" + i)).path("id").asLong();
            mvc.perform(as(reader, post("/api/saved-posts/" + id))).andExpect(status().isOk());
        }
        long seventh = createPost(seller, unique("Seventh")).path("id").asLong();

        mvc.perform(as(reader, post("/api/saved-posts/" + seventh))).andExpect(status().isBadRequest());
        mvc.perform(as(reader, get("/api/saved-posts/ids"))).andExpect(jsonPath("$", hasSize(6)));
    }

    @Test
    void hiddenListingsDropOffTheSavedList() throws Exception {
        Account seller = register("Seller");
        Account reader = register("Reader");
        long id = createPost(seller, unique("Soon hidden")).path("id").asLong();
        mvc.perform(as(reader, post("/api/saved-posts/" + id)));

        mvc.perform(jsonBody(as(seller, patch("/api/posts/" + id + "/visibility")), Map.of("isPublic", false)));

        mvc.perform(as(reader, get("/api/saved-posts"))).andExpect(jsonPath("$.count").value(0));
    }

    @Test
    void savingRequiresLogin() throws Exception {
        mvc.perform(post("/api/saved-posts/1")).andExpect(status().isUnauthorized());
    }
}
