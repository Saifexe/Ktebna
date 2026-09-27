package com.ktebna.backend.controller;

import com.ktebna.backend.dto.MessageResponse;
import com.ktebna.backend.dto.SendMessageRequest;
import com.ktebna.backend.dto.SendMessageResponse;
import com.ktebna.backend.entity.User;
import com.ktebna.backend.service.MessagingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class MessageController {

    private final MessagingService messagingService;

    // The whole thread, or with ?afterId= only the messages newer than that one.
    @GetMapping("/conversations/{conversationId}/messages")
    public List<MessageResponse> getMessages(@AuthenticationPrincipal User currentUser,
                                             @PathVariable Long conversationId,
                                             @RequestParam(required = false) Long afterId) {
        return messagingService.messages(currentUser, conversationId, afterId);
    }

    @PostMapping("/messages")
    public SendMessageResponse sendMessage(@AuthenticationPrincipal User currentUser,
                                           @Valid @RequestBody SendMessageRequest req) {
        return messagingService.send(currentUser, req);
    }
}
