package com.ktebna.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class SendMessageResponse {
    private ConversationResponse conversation;
    private MessageResponse message;
}
