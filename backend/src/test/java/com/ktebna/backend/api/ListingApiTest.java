package com.ktebna.backend.api;

import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.endsWith;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ListingApiTest extends ApiTestBase {

    @Test
    void createStoresEveryFieldIncludingTheV2Ones() throws Exception {
        Account seller = register("Seller");
        JsonNode post = createPost(seller, unique("Dune"), true, Map.of(
                "bookDescription", "Hardcover, no markings",
                "pickupLat", "35.8256",
                "pickupLng", "10.636",
                "pickupSpot", "Sousse medina"));

        mvc.perform(get("/api/posts/" + post.path("id").asLong()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.bookAuthor").value("Test Author"))
                .andExpect(jsonPath("$.bookCondition").value("likeNew"))
                .andExpect(jsonPath("$.bookDescription").value("Hardcover, no markings"))
                .andExpect(jsonPath("$.pickupLat").value(35.8256))
                .andExpect(jsonPath("$.pickupSpot").value("Sousse medina"))
                .andExpect(jsonPath("$.bookImage", endsWith(".jpg")))
                .andExpect(jsonPath("$.isPublic").value(true));
    }

    @Test
    void bookNameIsRequired() throws Exception {
        Account seller = register("NoName");

        mvc.perform(listing(HttpMethod.POST, "/api/posts", seller, Map.of("bookLocation", "Sousse")))
                .andExpect(status().isBadRequest());
        mvc.perform(listing(HttpMethod.POST, "/api/posts", seller, Map.of("bookName", "   ")))
                .andExpect(status().isBadRequest());
    }

    @Test
    void outOfRangeCoordinatesAreDiscarded() throws Exception {
        Account seller = register("Pin");
        JsonNode post = createPost(seller, unique("Pin"), true, Map.of("pickupLat", "999", "pickupLng", "10", "pickupSpot", "Nowhere"));

        assertThat(post.path("pickupLat").isNull()).isTrue();
        assertThat(post.path("pickupSpot").isNull()).isTrue();
    }

    @Test
    void creatingAListingRequiresLogin() throws Exception {
        mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart("/api/posts").param("bookName", "x"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void searchMatchesTitleOrAuthorCaseInsensitively() throws Exception {
        Account seller = register("Search");
        String marker = unique("zqx");
        createPost(seller, "The " + marker + " Chronicles", true, Map.of());
        createPost(seller, "Another book", true, Map.of("bookAuthor", marker.toUpperCase() + " Writer"));
        createPost(seller, "Hidden " + marker, false, Map.of());

        mvc.perform(get("/api/posts").param("search", marker))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.count").value(2))
                .andExpect(jsonPath("$.data", hasSize(2)));
    }

    @Test
    void feedFiltersByCategoryDealTypeAndCity() throws Exception {
        Account seller = register("Filter");
        String marker = unique("flt");
        createPost(seller, marker + " one", true, Map.of("bookCategory", "Manga & Comics", "bookDealType", "exchange", "bookLocation", "Tunis"));
        createPost(seller, marker + " two", true, Map.of("bookCategory", "Fiction", "bookDealType", "exchange", "bookLocation", "Tunis"));

        mvc.perform(get("/api/posts").param("search", marker).param("category", "Manga & Comics"))
                .andExpect(jsonPath("$.count").value(1));
        mvc.perform(get("/api/posts").param("search", marker).param("dealType", "exchange").param("location", "Tunis"))
                .andExpect(jsonPath("$.count").value(2));
        mvc.perform(get("/api/posts").param("search", marker).param("location", "Sfax"))
                .andExpect(jsonPath("$.count").value(0));
    }

    @Test
    void hiddenListingIsOnlyVisibleToItsOwner() throws Exception {
        Account owner = register("Owner");
        Account stranger = register("Stranger");
        long id = createPost(owner, unique("Secret"), false, Map.of()).path("id").asLong();

        mvc.perform(get("/api/posts/" + id)).andExpect(status().isNotFound());
        mvc.perform(as(stranger, get("/api/posts/" + id))).andExpect(status().isNotFound());
        mvc.perform(as(owner, get("/api/posts/" + id))).andExpect(status().isOk());
    }

    @Test
    void visibilityToggleAcceptsTheIsPublicFieldTheFrontendSends() throws Exception {
        // Regression: Lombok's isPublic naming made Jackson ignore {"isPublic": ...}.
        Account owner = register("Toggle");
        String name = unique("Toggle");
        long id = createPost(owner, name).path("id").asLong();

        mvc.perform(jsonBody(as(owner, patch("/api/posts/" + id + "/visibility")), Map.of("isPublic", false)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isPublic").value(false));
        mvc.perform(get("/api/posts").param("search", name)).andExpect(jsonPath("$.count").value(0));

        mvc.perform(jsonBody(as(owner, patch("/api/posts/" + id + "/visibility")), Map.of("isPublic", true)))
                .andExpect(jsonPath("$.isPublic").value(true));
        mvc.perform(get("/api/posts").param("search", name)).andExpect(jsonPath("$.count").value(1));
    }

    @Test
    void onlyTheOwnerCanEditHideOrDelete() throws Exception {
        Account owner = register("Owner");
        Account intruder = register("Intruder");
        long id = createPost(owner, unique("Mine")).path("id").asLong();

        mvc.perform(listing(HttpMethod.PUT, "/api/posts/" + id, intruder, Map.of("bookName", "Hijacked")))
                .andExpect(status().isForbidden());
        mvc.perform(jsonBody(as(intruder, patch("/api/posts/" + id + "/visibility")), Map.of("isPublic", false)))
                .andExpect(status().isForbidden());
        mvc.perform(as(intruder, delete("/api/posts/" + id))).andExpect(status().isForbidden());

        mvc.perform(listing(HttpMethod.PUT, "/api/posts/" + id, owner, Map.of("bookName", "Renamed", "bookLocation", "Sfax")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.bookName").value("Renamed"));
    }

    @Test
    void deletingAListingThatOthersBookmarkedSucceeds() throws Exception {
        // Regression: the saved_posts foreign key made this a 500.
        Account owner = register("Owner");
        Account fan = register("Fan");
        long id = createPost(owner, unique("Popular")).path("id").asLong();
        mvc.perform(as(fan, post("/api/saved-posts/" + id))).andExpect(status().isOk());

        mvc.perform(as(owner, delete("/api/posts/" + id))).andExpect(status().isOk());

        mvc.perform(get("/api/posts/" + id)).andExpect(status().isNotFound());
        mvc.perform(as(fan, get("/api/saved-posts/ids"))).andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    void myListingsIncludeHiddenOnesAndRequireLogin() throws Exception {
        Account owner = register("Mine");
        createPost(owner, unique("Public"));
        createPost(owner, unique("Private"), false, Map.of());

        mvc.perform(as(owner, get("/api/posts/me"))).andExpect(jsonPath("$.count").value(2));
        mvc.perform(get("/api/posts/me")).andExpect(status().isUnauthorized());
    }

    @Test
    void listingsNeverExposeTheSellersEmail() throws Exception {
        Account seller = register("Private Seller");
        String name = unique("NoEmail");
        long id = createPost(seller, name).path("id").asLong();

        String feed = mvc.perform(get("/api/posts").param("search", name)).andReturn().getResponse().getContentAsString();
        String detail = mvc.perform(get("/api/posts/" + id)).andReturn().getResponse().getContentAsString();

        assertThat(feed).doesNotContain(seller.email()).contains("Private Seller");
        assertThat(detail).doesNotContain(seller.email());
    }

    @Test
    void nonImageUploadsAreRejected() throws Exception {
        Account seller = register("Uploader");
        var req = org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart("/api/posts")
                .file(new org.springframework.mock.web.MockMultipartFile("image", "cover.jpg", "image/jpeg", "<?php echo 1; ?>".getBytes()))
                .param("bookName", "Fake image")
                .header("Authorization", seller.bearer());

        mvc.perform(req)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Only JPEG, PNG, GIF or WebP images are allowed"));
    }
}
