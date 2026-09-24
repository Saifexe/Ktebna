package com.ktebna.backend.api;

import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpMethod;
import org.springframework.mock.web.MockMultipartFile;

import java.nio.file.Path;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// Photos leave the disk with the row that pointed at them. Otherwise a deleted
// listing or account keeps its photos publicly reachable at their old URL.
class UploadCleanupApiTest extends ApiTestBase {

    @Value("${app.upload.dir}")
    private String uploadDir;

    private Path file(String url) {
        return Path.of(uploadDir).resolve(url.substring("/uploads/".length()));
    }

    private String uploadAvatar(Account account) throws Exception {
        return body(mvc.perform(multipart("/api/account/profile-picture")
                        .file(new MockMultipartFile("file", "me.jpg", "image/jpeg", JPEG))
                        .header("Authorization", account.bearer()))
                .andExpect(status().isOk())).path("profilePicture").asText();
    }

    @Test
    void replacingOrDeletingAListingsPhotoRemovesTheOldFile() throws Exception {
        Account seller = register("Photo");
        JsonNode post = createPost(seller, unique("Photo"));
        long id = post.path("id").asLong();
        String first = post.path("bookImage").asText();
        assertThat(file(first)).exists();

        String second = body(mvc.perform(listing(HttpMethod.PUT, "/api/posts/" + id, seller, Map.of("bookName", "New photo")))
                .andExpect(status().isOk())).path("bookImage").asText();
        assertThat(second).isNotEqualTo(first);
        assertThat(file(first)).doesNotExist();
        assertThat(file(second)).exists();

        // An edit without a new photo keeps the current one.
        mvc.perform(multipart(HttpMethod.PUT, "/api/posts/" + id).param("bookName", "Renamed")
                .header("Authorization", seller.bearer())).andExpect(status().isOk());
        assertThat(file(second)).exists();

        mvc.perform(as(seller, delete("/api/posts/" + id))).andExpect(status().isOk());
        assertThat(file(second)).doesNotExist();
    }

    @Test
    void replacingAnAvatarOrDeletingTheAccountRemovesItsPhotos() throws Exception {
        Account leaving = register("Leaving");
        String cover = createPost(leaving, unique("Cover")).path("bookImage").asText();
        String oldAvatar = uploadAvatar(leaving);
        String avatar = uploadAvatar(leaving);
        assertThat(file(oldAvatar)).as("replaced avatar").doesNotExist();

        Account staying = register("Staying");
        String othersCover = createPost(staying, unique("Kept")).path("bookImage").asText();

        mvc.perform(as(leaving, delete("/api/account"))).andExpect(status().isOk());

        assertThat(file(cover)).doesNotExist();
        assertThat(file(avatar)).doesNotExist();
        assertThat(file(othersCover)).exists();
    }
}
