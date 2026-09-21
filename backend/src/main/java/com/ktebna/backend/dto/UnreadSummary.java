package com.ktebna.backend.dto;

import java.time.LocalDateTime;
import java.util.List;

// Unread messages for the current user, newest conversation first.
public record UnreadSummary(long total, List<Item> conversations) {

    public record Item(Long conversationId, long count, UserDto otherUser,
                       String conversationTopic, String lastMessageContent,
                       Long lastMessageSender, LocalDateTime updatedAt) {
    }
}
