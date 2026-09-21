package com.ktebna.backend.controller;

import com.ktebna.backend.dto.ConversationResponse;
import com.ktebna.backend.dto.UnreadSummary;
import com.ktebna.backend.dto.UserDto;
import com.ktebna.backend.entity.Conversation;
import com.ktebna.backend.entity.User;
import com.ktebna.backend.exception.ApiException;
import com.ktebna.backend.repository.ConversationRepository;
import com.ktebna.backend.repository.MessageRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/conversations")
@RequiredArgsConstructor
public class ConversationController {

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;

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

    // Badge + new-message popups: unread counts per conversation, newest first
    @GetMapping("/unread")
    public UnreadSummary getUnread(@AuthenticationPrincipal User currentUser) {
        Map<Long, Long> counts = new HashMap<>();
        for (Object[] row : messageRepository.countUnreadByConversation(currentUser.getId())) {
            counts.put((Long) row[0], (Long) row[1]);
        }
        List<UnreadSummary.Item> items = conversationRepository.findAllById(counts.keySet()).stream()
                .sorted(Comparator.comparing(Conversation::getUpdatedAt,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .map(conv -> {
                    User other = conv.getFirstUser().getId().equals(currentUser.getId())
                            ? conv.getSecondUser() : conv.getFirstUser();
                    return new UnreadSummary.Item(conv.getId(), counts.get(conv.getId()),
                            new UserDto(other.getId(), other.getName(), null, other.getProfilePicture()),
                            conv.getConversationTopic(), conv.getLastMessageContent(),
                            conv.getLastMessageSender(), conv.getUpdatedAt());
                })
                .toList();
        long total = counts.values().stream().mapToLong(Long::longValue).sum();
        return new UnreadSummary(total, items);
    }

    // Opening a conversation marks everything in it as read for the current user
    @PostMapping("/{id}/read")
    @Transactional
    public void markRead(@AuthenticationPrincipal User currentUser, @PathVariable Long id) {
        Conversation conv = conversationRepository.findById(id)
                .orElseThrow(() -> new ApiException("Conversation not found", HttpStatus.NOT_FOUND));
        assertParticipant(currentUser, conv);
        conv.markReadUpTo(currentUser.getId(), messageRepository.findLatestId(id));
        conversationRepository.save(conv);
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
