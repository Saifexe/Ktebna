package com.ktebna.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
public class ConversationResponse {
    private Long id;
    private String conversationTopic;
    private String lastMessageContent;
    private Long lastMessageSender;
    private LocalDateTime updatedAt;
    private UserDto firstUser;
    private UserDto secondUser;
}
