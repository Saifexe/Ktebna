package com.ktebna.backend.dto;

import com.ktebna.backend.entity.Conversation;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
@AllArgsConstructor
public class ConversationResponse {
    private Long id;
    private String conversationTopic;
    private String lastMessageContent;
    private Long lastMessageSender;
    private Instant updatedAt;
    private UserDto firstUser;
    private UserDto secondUser;

    public static ConversationResponse from(Conversation conv) {
        return new ConversationResponse(
                conv.getId(), conv.getConversationTopic(), conv.getLastMessageContent(),
                conv.getLastMessageSender(), conv.getUpdatedAt(),
                // Participants only need names and avatars, not email addresses.
                UserDto.withoutEmail(conv.getFirstUser()),
                UserDto.withoutEmail(conv.getSecondUser())
        );
    }
}
