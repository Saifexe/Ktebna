package com.ktebna.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.time.Duration;
import java.util.Map;

// Calls the same external mailer microservice the original frontend used
// (kept external and unchanged - see src/chat/emailService.js on the frontend).
@Service
public class EmailNotificationService {

    @Value("${app.mailer.url}")
    private String mailerUrl;

    // The mailer runs on a free host that sleeps when idle and can take close to
    // a minute to wake up. Bounded timeouts keep a dead mailer from pinning threads.
    private final RestClient restClient = RestClient.builder()
            .requestFactory(timeouts())
            .build();

    private static SimpleClientHttpRequestFactory timeouts() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(10));
        factory.setReadTimeout(Duration.ofSeconds(90));
        return factory;
    }

    // Runs on a background thread so sending a chat message never waits on email.
    @Async
    public void sendNotification(String recipientEmail, String recipientName, String senderName,
                                  String messageContent, String bookName) {
        try {
            restClient.post()
                    .uri(mailerUrl)
                    .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                    .body(Map.of(
                            "recipientEmail", recipientEmail,
                            "recipientName", recipientName != null ? recipientName : "",
                            "senderName", senderName != null ? senderName : "",
                            "messageContent", messageContent,
                            "bookName", bookName != null ? bookName : ""
                    ))
                    .retrieve()
                    .toBodilessEntity();
        } catch (Exception e) {
            // Never fail message sending because of a notification hiccup
            System.err.println("Email notification failed: " + e.getMessage());
        }
    }
}
