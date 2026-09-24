package com.ktebna.backend.dto;

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
}
