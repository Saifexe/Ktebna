package com.ktebna.backend.dto;

import com.ktebna.backend.entity.Message;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
@AllArgsConstructor
public class MessageResponse {
    private Long id;
    private String messageContent;
    private Instant createdAt;
    private Long userId;
    private String userName;

    public static MessageResponse from(Message m) {
        return new MessageResponse(m.getId(), m.getMessageContent(), m.getCreatedAt(),
                m.getUser().getId(), m.getUser().getName());
    }
}
