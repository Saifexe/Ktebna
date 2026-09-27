package com.ktebna.backend.controller;

import com.ktebna.backend.dto.ConversationResponse;
import com.ktebna.backend.dto.UnreadSummary;
import com.ktebna.backend.entity.User;
import com.ktebna.backend.service.MessagingService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/conversations")
@RequiredArgsConstructor
public class ConversationController {

    private final MessagingService messagingService;

    // All conversations the current user is part of
    @GetMapping
    public List<ConversationResponse> getMyConversations(@AuthenticationPrincipal User currentUser) {
        return messagingService.conversationsOf(currentUser);
    }

    // Existing conversation with a specific other user, if any
    @GetMapping("/with/{otherUserId}")
    public ConversationResponse getWithUser(@AuthenticationPrincipal User currentUser,
                                            @PathVariable Long otherUserId) {
        return messagingService.conversationWith(currentUser, otherUserId);
    }

    // Badge + new-message popups: unread counts per conversation, newest first
    @GetMapping("/unread")
    public UnreadSummary getUnread(@AuthenticationPrincipal User currentUser) {
        return messagingService.unread(currentUser);
    }

    // Opening a conversation marks everything in it as read for the current user
    @PostMapping("/{id}/read")
    public void markRead(@AuthenticationPrincipal User currentUser, @PathVariable Long id) {
        messagingService.markRead(currentUser, id);
    }

    @GetMapping("/{id}")
    public ConversationResponse getOne(@AuthenticationPrincipal User currentUser, @PathVariable Long id) {
        return messagingService.conversation(currentUser, id);
    }
}
