package com.ktebna.backend.api;

import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ProfileApiTest extends ApiTestBase {

    @Test
    void visitorsCanSeeAProfileButNeverTheEmail() throws Exception {
        Account reader = register("Amira");

        JsonNode profile = body(mvc.perform(get("/api/users/" + reader.id() + "/profile"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Amira"))
                .andExpect(jsonPath("$.memberSince").isNotEmpty()));
        assertThat(profile.has("email")).isFalse();
        assertThat(profile.toString()).doesNotContain(reader.email());
    }

    @Test
    void profileListsOnlyPublicUnsoldBooksAndCountsFinishedDeals() throws Exception {
        Account seller = register("Seller");
        createPost(seller, unique("OnOffer"));
        createPost(seller, unique("Hidden"), false, Map.of());
        long sold = createPost(seller, unique("Gone")).path("id").asLong();
        mvc.perform(jsonBody(as(seller, patch("/api/posts/" + sold + "/status")), Map.of("status", "SOLD")));

        mvc.perform(get("/api/users/" + seller.id() + "/posts"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.count").value(1))
                .andExpect(jsonPath("$.data[0].bookName").value(org.hamcrest.Matchers.startsWith("OnOffer")))
                .andExpect(jsonPath("$.data[0].user.email").doesNotExist());
        mvc.perform(get("/api/users/" + seller.id() + "/profile"))
                .andExpect(jsonPath("$.activeListings").value(1))
                .andExpect(jsonPath("$.completedDeals").value(1));
    }

    @Test
    void unknownReadersAreA404() throws Exception {
        mvc.perform(get("/api/users/999999999/profile")).andExpect(status().isNotFound());
        mvc.perform(get("/api/users/999999999/posts")).andExpect(status().isNotFound());
    }

    @Test
    void onlyTheProfileRoutesAreOpenToVisitors() throws Exception {
        Account reader = register("Reader");
        mvc.perform(get("/api/users/" + reader.id())).andExpect(status().isUnauthorized());
    }
}
