package com.ktebna.backend.unit;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ktebna.backend.service.EmailNotificationService;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;

class EmailNotificationServiceTest {

    private HttpServer mailer;
    private final AtomicReference<String> received = new AtomicReference<>();
    private final EmailNotificationService service = new EmailNotificationService();

    @BeforeEach
    void startFakeMailer() throws Exception {
        mailer = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        mailer.createContext("/send-email", exchange -> {
            received.set(new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8));
            exchange.sendResponseHeaders(200, -1);
            exchange.close();
        });
        mailer.start();
        ReflectionTestUtils.setField(service, "mailerUrl",
                "http://127.0.0.1:" + mailer.getAddress().getPort() + "/send-email");
    }

    @AfterEach
    void stopFakeMailer() {
        mailer.stop(0);
    }

    @Test
    void postsTheNotificationAsJson() throws Exception {
        service.sendNotification("seller@example.test", "Seller", "Buyer", "Is it available?", "Dune");

        JsonNode sent = new ObjectMapper().readTree(received.get());
        assertThat(sent.path("recipientEmail").asText()).isEqualTo("seller@example.test");
        assertThat(sent.path("recipientName").asText()).isEqualTo("Seller");
        assertThat(sent.path("senderName").asText()).isEqualTo("Buyer");
        assertThat(sent.path("messageContent").asText()).isEqualTo("Is it available?");
        assertThat(sent.path("bookName").asText()).isEqualTo("Dune");
    }

    @Test
    void missingOptionalFieldsAreSentAsEmptyStrings() throws Exception {
        service.sendNotification("seller@example.test", null, null, "Hi", null);

        JsonNode sent = new ObjectMapper().readTree(received.get());
        assertThat(sent.path("recipientName").asText()).isEmpty();
        assertThat(sent.path("bookName").asText()).isEmpty();
    }

    @Test
    void anUnreachableMailerNeverBreaksMessaging() {
        mailer.stop(0);

        assertThatCode(() -> service.sendNotification("a@example.test", "A", "B", "Hi", "Dune"))
                .doesNotThrowAnyException();
    }
}
