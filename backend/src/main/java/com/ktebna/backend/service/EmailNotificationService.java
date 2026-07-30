package com.ktebna.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.Map;

// Calls the same external mailer microservice the original frontend used
// (kept external and unchanged - see src/chat/emailService.js on the frontend).
@Service
public class EmailNotificationService {

    @Value("${app.mailer.url}")
    private String mailerUrl;

    private final RestClient restClient = RestClient.create();

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
