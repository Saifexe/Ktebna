package com.ktebna.backend.controller;

import com.ktebna.backend.dto.ConversationResponse;
import com.ktebna.backend.dto.UserDto;
import com.ktebna.backend.entity.Conversation;
import com.ktebna.backend.entity.User;
import com.ktebna.backend.exception.ApiException;
import com.ktebna.backend.repository.ConversationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/conversations")
@RequiredArgsConstructor
public class ConversationController {

    private final ConversationRepository conversationRepository;

    // All conversations the current user is part of
    @GetMapping
    public List<ConversationResponse> getMyConversations(@AuthenticationPrincipal User currentUser) {
        return conversationRepository.findAllForUser(currentUser.getId()).stream()
                .map(this::toResponse)
                .toList();
    }

    // Existing conversation with a specific other user, if any
    @GetMapping("/with/{otherUserId}")
    public ConversationResponse getWithUser(@AuthenticationPrincipal User currentUser,
                                             @PathVariable Long otherUserId) {
        Optional<Conversation> conv = conversationRepository.findBetweenUsers(currentUser.getId(), otherUserId);
        return conv.map(this::toResponse).orElse(null);
    }

    @GetMapping("/{id}")
    public ConversationResponse getOne(@AuthenticationPrincipal User currentUser, @PathVariable Long id) {
        Conversation conv = conversationRepository.findById(id)
                .orElseThrow(() -> new ApiException("Conversation not found", HttpStatus.NOT_FOUND));
        assertParticipant(currentUser, conv);
        return toResponse(conv);
    }

    static void assertParticipant(User user, Conversation conv) {
        boolean participant = conv.getFirstUser().getId().equals(user.getId())
                || conv.getSecondUser().getId().equals(user.getId());
        if (!participant) {
            throw new ApiException("You are not part of this conversation", HttpStatus.FORBIDDEN);
        }
    }

    static ConversationResponse toResponseStatic(Conversation conv) {
        User f = conv.getFirstUser();
        User s = conv.getSecondUser();
        return new ConversationResponse(
                conv.getId(), conv.getConversationTopic(), conv.getLastMessageContent(),
                conv.getLastMessageSender(), conv.getUpdatedAt(),
                new UserDto(f.getId(), f.getName(), f.getEmail(), f.getProfilePicture()),
                new UserDto(s.getId(), s.getName(), s.getEmail(), s.getProfilePicture())
        );
    }

    private ConversationResponse toResponse(Conversation conv) {
        return toResponseStatic(conv);
    }
}
