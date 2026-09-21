package com.ktebna.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "conversations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Conversation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "first_user_id", nullable = false)
    private User firstUser;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "second_user_id", nullable = false)
    private User secondUser;

    @Column(name = "conversation_topic", length = 200)
    private String conversationTopic;

    @Column(name = "last_message_content", length = 1000)
    private String lastMessageContent;

    @Column(name = "last_message_sender")
    private Long lastMessageSender;

    // Id of the newest message each participant has seen; anything newer from
    // the other participant is unread. Ids (not timestamps) because the MySQL
    // datetime columns only keep whole seconds.
    @Column(name = "first_user_last_read_id")
    private Long firstUserLastReadId;

    @Column(name = "second_user_last_read_id")
    private Long secondUserLastReadId;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public void markReadUpTo(Long userId, Long messageId) {
        if (messageId == null) return;
        if (firstUser.getId().equals(userId)) {
            firstUserLastReadId = Math.max(messageId, firstUserLastReadId == null ? 0 : firstUserLastReadId);
        } else if (secondUser.getId().equals(userId)) {
            secondUserLastReadId = Math.max(messageId, secondUserLastReadId == null ? 0 : secondUserLastReadId);
        }
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }
}
