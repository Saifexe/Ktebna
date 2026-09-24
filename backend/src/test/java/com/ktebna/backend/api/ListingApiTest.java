package com.ktebna.backend.api;

import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;

import java.time.Instant;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.endsWith;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.lessThanOrEqualTo;
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
    void timesAreSentAsUtcInstantsSoBrowsersShowTheirLocalTime() throws Exception {
        Account seller = register("Clock");
        Instant before = Instant.now().minusSeconds(1);
        JsonNode post = createPost(seller, unique("Clock"), true, Map.of());

        // "2026-09-24T11:15:23.123456Z": without the Z, a browser in Tunis reads it as local time, an hour off.
        String createdAt = post.path("createdAt").asText();
        assertThat(createdAt).endsWith("Z");
        assertThat(Instant.parse(createdAt)).isBetween(before, Instant.now().plusSeconds(1));
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

    @Test
    void overlongFieldsAreA400NotAServerError() throws Exception {
        Account seller = register("Seller");
        mvc.perform(listing(HttpMethod.POST, "/api/posts", seller,
                        Map.of("bookName", "Long notes", "bookDescription", "x".repeat(2001))))
                .andExpect(status().isBadRequest());
        mvc.perform(listing(HttpMethod.POST, "/api/posts", seller,
                        Map.of("bookName", "Long city", "bookLocation", "x".repeat(101))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void pageSizeIsCappedAndNegativePagesAreClamped() throws Exception {
        mvc.perform(get("/api/posts").param("page", "-3").param("size", "1000000"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(lessThanOrEqualTo(50)));
    }

    @Test
    void uploadedCoversAreStoredAsRelativePaths() throws Exception {
        Account seller = register("Seller");
        JsonNode post = createPost(seller, unique("Relative"));
        assertThat(post.path("bookImage").asText()).startsWith("/uploads/").endsWith(".jpg");
    }

    @Test
    void salePricesAreAlwaysStoredInTnd() throws Exception {
        Account seller = register("Seller");
        Map<String, String> expected = Map.of(
                "35", "35 TND",
                "35 TND", "35 TND",
                "35dt", "35 TND",
                "12,500", "12.5 TND",
                " 7.25 tnd ", "7.25 TND");
        for (var entry : expected.entrySet()) {
            JsonNode post = createPost(seller, unique("Priced"), true, Map.of("bookDeal", entry.getKey()));
            assertThat(post.path("bookDeal").asText()).as(entry.getKey()).isEqualTo(entry.getValue());
        }
    }

    @Test
    void salePricesInOtherCurrenciesOrWordsAreRefused() throws Exception {
        Account seller = register("Seller");
        for (String price : new String[]{"25 €", "$20", "20 EUR", "cheap", "0", "-5", "", "1234567"}) {
            Map<String, String> fields = Map.of("bookName", "Priced", "bookDealType", "sell", "bookDeal", price);
            mvc.perform(listing(HttpMethod.POST, "/api/posts", seller, fields))
                    .andExpect(status().isBadRequest());
        }
    }

    @Test
    void swapsKeepTheirFreeTextWish() throws Exception {
        Account seller = register("Seller");
        JsonNode post = createPost(seller, unique("Swap"), true,
                Map.of("bookDealType", "exchange", "bookDeal", "Any YA novel, or 20 TND"));
        assertThat(post.path("bookDeal").asText()).isEqualTo("Any YA novel, or 20 TND");
    }

    @Test
    void newListingsStartAvailable() throws Exception {
        Account seller = register("Seller");
        assertThat(createPost(seller, unique("Fresh")).path("status").asText()).isEqualTo("AVAILABLE");
    }

    @Test
    void reservedListingsStayInTheFeedAndSoldOnesLeaveIt() throws Exception {
        Account seller = register("Seller");
        String name = unique("Dune");
        long id = createPost(seller, name).path("id").asLong();

        mvc.perform(jsonBody(as(seller, patch("/api/posts/" + id + "/status")), Map.of("status", "RESERVED")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("RESERVED"));
        mvc.perform(get("/api/posts").param("search", name))
                .andExpect(jsonPath("$.count").value(1))
                .andExpect(jsonPath("$.data[0].status").value("RESERVED"));

        mvc.perform(jsonBody(as(seller, patch("/api/posts/" + id + "/status")), Map.of("status", "SOLD")))
                .andExpect(jsonPath("$.status").value("SOLD"));
        mvc.perform(get("/api/posts").param("search", name)).andExpect(jsonPath("$.count").value(0));

        // Still reachable by link and in the seller's own list.
        mvc.perform(get("/api/posts/" + id)).andExpect(jsonPath("$.status").value("SOLD"));
        mvc.perform(as(seller, get("/api/posts/me"))).andExpect(jsonPath("$.data[0].status").value("SOLD"));
    }

    @Test
    void savedBooksStillShowOnceSold() throws Exception {
        Account seller = register("Seller");
        Account reader = register("Reader");
        long id = createPost(seller, unique("Saved")).path("id").asLong();
        mvc.perform(as(reader, post("/api/saved-posts/" + id))).andExpect(status().isOk());

        mvc.perform(jsonBody(as(seller, patch("/api/posts/" + id + "/status")), Map.of("status", "SOLD")));

        mvc.perform(as(reader, get("/api/saved-posts")))
                .andExpect(jsonPath("$.count").value(1))
                .andExpect(jsonPath("$.data[0].status").value("SOLD"));
    }

    @Test
    void onlyTheOwnerCanChangeTheStatus() throws Exception {
        Account seller = register("Seller");
        Account intruder = register("Intruder");
        long id = createPost(seller, unique("Mine")).path("id").asLong();

        mvc.perform(jsonBody(as(intruder, patch("/api/posts/" + id + "/status")), Map.of("status", "SOLD")))
                .andExpect(status().isForbidden());
        mvc.perform(jsonBody(patch("/api/posts/" + id + "/status"), Map.of("status", "SOLD")))
                .andExpect(status().isUnauthorized());
        mvc.perform(get("/api/posts/" + id)).andExpect(jsonPath("$.status").value("AVAILABLE"));
    }

    @Test
    void unknownOrMissingStatusIsA400() throws Exception {
        Account seller = register("Seller");
        long id = createPost(seller, unique("Odd")).path("id").asLong();

        mvc.perform(jsonBody(as(seller, patch("/api/posts/" + id + "/status")), Map.of("status", "STOLEN")))
                .andExpect(status().isBadRequest());
        mvc.perform(jsonBody(as(seller, patch("/api/posts/" + id + "/status")), Map.of()))
                .andExpect(status().isBadRequest());
    }

    @Test
    void editingAListingKeepsItsStatus() throws Exception {
        Account seller = register("Seller");
        long id = createPost(seller, unique("Kept")).path("id").asLong();
        mvc.perform(jsonBody(as(seller, patch("/api/posts/" + id + "/status")), Map.of("status", "RESERVED")));

        mvc.perform(listing(HttpMethod.PUT, "/api/posts/" + id, seller, Map.of("bookName", "Renamed")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("RESERVED"));
    }
}
