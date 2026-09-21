package com.ktebna.backend.api;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ktebna.backend.service.EmailNotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.request.MockMultipartHttpServletRequestBuilder;
import org.testcontainers.containers.MySQLContainer;

import java.util.Map;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Boots the whole backend (security filters included) against a real MySQL 8
 * started once in Docker and shared by every test class. Each test creates its
 * own uniquely named users and posts, so tests don't depend on each other.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public abstract class ApiTestBase {

    @ServiceConnection
    static final MySQLContainer<?> MYSQL = new MySQLContainer<>("mysql:8.0");

    static {
        MYSQL.start();
    }

    @Autowired
    protected MockMvc mvc;

    @Autowired
    protected ObjectMapper json;

    // Messaging calls the external mailer; tests must never reach it.
    @MockitoBean
    protected EmailNotificationService emailNotificationService;

    /** A logged-in test user. */
    protected record Account(long id, String email, String token) {
        String bearer() {
            return "Bearer " + token;
        }
    }

    protected static String unique(String prefix) {
        return prefix + "-" + UUID.randomUUID().toString().substring(0, 8);
    }

    /** Smallest byte sequence the upload check accepts as a JPEG. */
    protected static final byte[] JPEG = {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0, 0, 0x10, 'J', 'F', 'I', 'F', 0, 1};

    protected JsonNode body(ResultActions result) throws Exception {
        return json.readTree(result.andReturn().getResponse().getContentAsString());
    }

    protected Account register(String name) throws Exception {
        String email = unique(name.toLowerCase().replace(' ', '.')) + "@example.test";
        JsonNode res = body(mvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("name", name, "email", email, "password", "secret123"))))
                .andExpect(status().isOk()));
        return new Account(res.path("user").path("id").asLong(), email, res.path("token").asText());
    }

    protected MockMultipartHttpServletRequestBuilder listing(HttpMethod method, String url, Account owner,
                                                             Map<String, String> fields) {
        MockMultipartHttpServletRequestBuilder req = multipart(method, url);
        req.file(new MockMultipartFile("image", "cover.jpg", "image/jpeg", JPEG));
        fields.forEach(req::param);
        req.header("Authorization", owner.bearer());
        return req;
    }

    /** Creates a listing and returns its JSON. */
    protected JsonNode createPost(Account owner, String bookName, boolean isPublic, Map<String, String> extra) throws Exception {
        Map<String, String> fields = new java.util.HashMap<>(Map.of(
                "bookName", bookName,
                "bookAuthor", "Test Author",
                "bookCategory", "Fiction",
                "bookCondition", "likeNew",
                "bookDealType", "sell",
                "bookDeal", "20 TND",
                "bookLocation", "Sousse",
                "isPublic", String.valueOf(isPublic)));
        fields.putAll(extra);
        return body(mvc.perform(listing(HttpMethod.POST, "/api/posts", owner, fields)).andExpect(status().isOk()));
    }

    protected JsonNode createPost(Account owner, String bookName) throws Exception {
        return createPost(owner, bookName, true, Map.of());
    }

    protected MockHttpServletRequestBuilder as(Account account, MockHttpServletRequestBuilder req) {
        return req.header("Authorization", account.bearer());
    }

    protected MockHttpServletRequestBuilder jsonBody(MockHttpServletRequestBuilder req, Object body) throws Exception {
        return req.contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(body));
    }
}
