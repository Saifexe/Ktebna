package com.ktebna.backend.api;

import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AccountApiTest extends ApiTestBase {

    @Test
    void deletingAnAccountRemovesEverythingThatBelongsToIt() throws Exception {
        // Regression: foreign keys on posts, bookmarks and messages made this a 500.
        Account leaving = register("Leaving");
        Account friend = register("Friend");
        long leavingPost = createPost(leaving, unique("Leaving book")).path("id").asLong();
        long friendPost = createPost(friend, unique("Friend book")).path("id").asLong();
        mvc.perform(as(leaving, post("/api/saved-posts/" + friendPost)));      // their bookmark
        mvc.perform(as(friend, post("/api/saved-posts/" + leavingPost)));      // a bookmark on their post
        mvc.perform(jsonBody(as(friend, post("/api/messages")),
                Map.of("otherUserId", leaving.id(), "bookName", "Hi", "messageContent", "Hello")));

        mvc.perform(as(leaving, delete("/api/account"))).andExpect(status().isOk());

        mvc.perform(get("/api/posts/" + leavingPost)).andExpect(status().isNotFound());
        mvc.perform(as(friend, get("/api/saved-posts/ids"))).andExpect(jsonPath("$", hasSize(0)));
        mvc.perform(as(friend, get("/api/conversations"))).andExpect(jsonPath("$", hasSize(0)));
        mvc.perform(jsonBody(post("/api/auth/login"), Map.of("email", leaving.email(), "password", "secret123")))
                .andExpect(status().isUnauthorized());
        // The friend's own data is untouched.
        mvc.perform(get("/api/posts/" + friendPost)).andExpect(status().isOk());
    }

    @Test
    void emailIsOnlyVisibleOnYourOwnProfile() throws Exception {
        Account alice = register("Alice");
        Account bob = register("Bob");

        mvc.perform(as(alice, get("/api/users/" + alice.id())))
                .andExpect(jsonPath("$.email").value(alice.email()));
        mvc.perform(as(bob, get("/api/users/" + alice.id())))
                .andExpect(jsonPath("$.name").value("Alice"))
                .andExpect(jsonPath("$.email").doesNotExist());
    }

    @Test
    void renameUpdatesTheProfile() throws Exception {
        Account user = register("Old Name");

        mvc.perform(jsonBody(as(user, put("/api/account/name")), Map.of("name", "New Name")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("New Name"));
        mvc.perform(as(user, get("/api/auth/me"))).andExpect(jsonPath("$.name").value("New Name"));
    }
}
