package com.ktebna.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
public class MessageResponse {
    private Long id;
    private String messageContent;
    private LocalDateTime createdAt;
    private Long userId;
    private String userName;
}
