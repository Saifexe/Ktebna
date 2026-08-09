package com.ktebna.backend.controller;

import com.ktebna.backend.dto.*;
import com.ktebna.backend.entity.Conversation;
import com.ktebna.backend.entity.Message;
import com.ktebna.backend.entity.User;
import com.ktebna.backend.exception.ApiException;
import com.ktebna.backend.repository.ConversationRepository;
import com.ktebna.backend.repository.MessageRepository;
import com.ktebna.backend.repository.UserRepository;
import com.ktebna.backend.service.EmailNotificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class MessageController {

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final EmailNotificationService emailNotificationService;

    @GetMapping("/conversations/{conversationId}/messages")
    public List<MessageResponse> getMessages(@AuthenticationPrincipal User currentUser,
                                              @PathVariable Long conversationId) {
        Conversation conv = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ApiException("Conversation not found", HttpStatus.NOT_FOUND));
        ConversationController.assertParticipant(currentUser, conv);

        return messageRepository.findByConversationIdOrderByCreatedAtAsc(conversationId).stream()
                .map(this::toResponse)
                .toList();
    }

    // Mirrors the original sendMessage() flow: get-or-create conversation,
    // enforce the 2-message-per-user limit, persist the message, update the
    // conversation preview, then fire an (non-blocking) email notification.
    @PostMapping("/messages")
    @Transactional
    public SendMessageResponse sendMessage(@AuthenticationPrincipal User currentUser,
                                            @Valid @RequestBody SendMessageRequest req) {
        User otherUser = userRepository.findById(req.getOtherUserId())
                .orElseThrow(() -> new ApiException("Recipient not found", HttpStatus.NOT_FOUND));

        Conversation conversation = conversationRepository
        .findBetweenUsers(currentUser.getId(), otherUser.getId())
        .orElseGet(() -> {
            Conversation c = new Conversation();
            if (currentUser.getId() < otherUser.getId()) {
                c.setFirstUser(currentUser);
                c.setSecondUser(otherUser);
            } else {
                c.setFirstUser(otherUser);
                c.setSecondUser(currentUser);
            }
            c.setConversationTopic(req.getBookName());
            return conversationRepository.save(c);
        });

        Message message = new Message();
        message.setConversation(conversation);
        message.setUser(currentUser);
        message.setMessageContent(req.getMessageContent());
        message = messageRepository.save(message);

        conversation.setLastMessageContent(req.getMessageContent());
        conversation.setLastMessageSender(currentUser.getId());
        conversation.setUpdatedAt(LocalDateTime.now());
        conversation = conversationRepository.save(conversation);

        if (otherUser.getEmail() != null && !otherUser.getEmail().isBlank()) {
            emailNotificationService.sendNotification(
                    otherUser.getEmail(),
                    otherUser.getName(),
                    currentUser.getName(),
                    req.getMessageContent(),
                    req.getBookName() != null ? req.getBookName() : conversation.getConversationTopic()
            );
        }

        return new SendMessageResponse(
                ConversationController.toResponseStatic(conversation),
                toResponse(message)
        );
    }

    private MessageResponse toResponse(Message m) {
        return new MessageResponse(m.getId(), m.getMessageContent(), m.getCreatedAt(),
                m.getUser().getId(), m.getUser().getName());
    }
}
