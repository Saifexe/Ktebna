package com.ktebna.backend.service;

import com.ktebna.backend.dto.ConversationResponse;
import com.ktebna.backend.dto.MessageResponse;
import com.ktebna.backend.dto.SendMessageRequest;
import com.ktebna.backend.dto.SendMessageResponse;
import com.ktebna.backend.dto.UnreadSummary;
import com.ktebna.backend.dto.UserDto;
import com.ktebna.backend.entity.Conversation;
import com.ktebna.backend.entity.Message;
import com.ktebna.backend.entity.User;
import com.ktebna.backend.exception.ApiException;
import com.ktebna.backend.repository.ConversationRepository;
import com.ktebna.backend.repository.MessageRepository;
import com.ktebna.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.Instant;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

// Conversations, messages and read tracking. Only participants can see a thread.
@Service
@RequiredArgsConstructor
@Transactional
public class MessagingService {

    private static final int PREVIEW_LENGTH = 1000;

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final EmailNotificationService emailNotificationService;

    @Transactional(readOnly = true)
    public List<ConversationResponse> conversationsOf(User user) {
        return conversationRepository.findAllForUser(user.getId()).stream()
                .map(ConversationResponse::from)
                .toList();
    }

    // Existing conversation with a specific other user, or null if none yet.
    @Transactional(readOnly = true)
    public ConversationResponse conversationWith(User user, Long otherUserId) {
        return conversationRepository.findBetweenUsers(user.getId(), otherUserId)
                .map(ConversationResponse::from)
                .orElse(null);
    }

    @Transactional(readOnly = true)
    public ConversationResponse conversation(User user, Long id) {
        return ConversationResponse.from(findAsParticipant(user, id));
    }

    // Badge + new-message popups: unread counts per conversation, newest first.
    @Transactional(readOnly = true)
    public UnreadSummary unread(User user) {
        Map<Long, Long> counts = new HashMap<>();
        for (Object[] row : messageRepository.countUnreadByConversation(user.getId())) {
            counts.put((Long) row[0], (Long) row[1]);
        }
        List<UnreadSummary.Item> items = conversationRepository.findByIdIn(counts.keySet()).stream()
                .sorted(Comparator.comparing(Conversation::getUpdatedAt,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .map(conv -> new UnreadSummary.Item(conv.getId(), counts.get(conv.getId()),
                        UserDto.withoutEmail(otherParticipant(conv, user)),
                        conv.getConversationTopic(), conv.getLastMessageContent(),
                        conv.getLastMessageSender(), conv.getUpdatedAt()))
                .toList();
        long total = counts.values().stream().mapToLong(Long::longValue).sum();
        return new UnreadSummary(total, items);
    }

    // Opening a conversation marks everything in it as read for the user.
    public void markRead(User user, Long id) {
        Conversation conv = findAsParticipant(user, id);
        conv.markReadUpTo(user.getId(), messageRepository.findLatestId(id));
        conversationRepository.save(conv);
    }

    // The whole thread, or with afterId only the messages newer than that one.
    @Transactional(readOnly = true)
    public List<MessageResponse> messages(User user, Long conversationId, Long afterId) {
        findAsParticipant(user, conversationId);
        List<Message> messages = afterId == null
                ? messageRepository.findByConversationIdOrderByIdAsc(conversationId)
                : messageRepository.findByConversationIdAndIdGreaterThanOrderByIdAsc(conversationId, afterId);
        return messages.stream().map(MessageResponse::from).toList();
    }

    // Get-or-create the conversation, store the message, update the preview,
    // then email the recipient once the message is committed.
    public SendMessageResponse send(User sender, SendMessageRequest req) {
        if (req.getOtherUserId().equals(sender.getId())) {
            throw new ApiException("You cannot message yourself", HttpStatus.BAD_REQUEST);
        }
        User recipient = userRepository.findById(req.getOtherUserId())
                .orElseThrow(() -> new ApiException("Recipient not found", HttpStatus.NOT_FOUND));

        Conversation conversation = conversationRepository
                .findBetweenUsers(sender.getId(), recipient.getId())
                .orElseGet(() -> startConversation(sender, recipient, req.getBookName()));

        Message message = new Message();
        message.setConversation(conversation);
        message.setUser(sender);
        message.setMessageContent(req.getMessageContent());
        message = messageRepository.save(message);

        conversation.setLastMessageContent(preview(req.getMessageContent()));
        conversation.setLastMessageSender(sender.getId());
        conversation.setUpdatedAt(Instant.now());
        // Writing a message means you've seen everything before it.
        conversation.markReadUpTo(sender.getId(), message.getId());
        conversation = conversationRepository.save(conversation);

        if (recipient.getEmail() != null && !recipient.getEmail().isBlank()) {
            String topic = req.getBookName() != null ? req.getBookName() : conversation.getConversationTopic();
            notifyAfterCommit(recipient.getEmail(), recipient.getName(), sender.getName(),
                    req.getMessageContent(), topic);
        }

        return new SendMessageResponse(ConversationResponse.from(conversation), MessageResponse.from(message));
    }

    // One conversation per pair: the lower user id is always firstUser, so the
    // unique (first, second) key stops two first messages creating duplicates.
    private Conversation startConversation(User a, User b, String topic) {
        Conversation c = new Conversation();
        boolean aFirst = a.getId() < b.getId();
        c.setFirstUser(aFirst ? a : b);
        c.setSecondUser(aFirst ? b : a);
        c.setConversationTopic(topic);
        return conversationRepository.save(c);
    }

    // If the transaction rolls back, no email goes out for a message that was never stored.
    private void notifyAfterCommit(String email, String recipientName, String senderName,
                                   String content, String topic) {
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                emailNotificationService.sendNotification(email, recipientName, senderName, content, topic);
            }
        });
    }

    private Conversation findAsParticipant(User user, Long id) {
        Conversation conv = conversationRepository.findById(id)
                .orElseThrow(() -> new ApiException("Conversation not found", HttpStatus.NOT_FOUND));
        boolean participant = conv.getFirstUser().getId().equals(user.getId())
                || conv.getSecondUser().getId().equals(user.getId());
        if (!participant) {
            throw new ApiException("You are not part of this conversation", HttpStatus.FORBIDDEN);
        }
        return conv;
    }

    private static User otherParticipant(Conversation conv, User user) {
        return conv.getFirstUser().getId().equals(user.getId()) ? conv.getSecondUser() : conv.getFirstUser();
    }

    // Messages hold up to 2000 characters; the preview column holds 1000.
    private static String preview(String content) {
        return content.length() <= PREVIEW_LENGTH ? content : content.substring(0, PREVIEW_LENGTH - 1) + "…";
    }
}
