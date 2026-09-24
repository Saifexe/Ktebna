package com.ktebna.backend.repository;

import com.ktebna.backend.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface MessageRepository extends JpaRepository<Message, Long> {
    // Ordered by id, the order messages were saved in: two sent within the same
    // instant still come back in the right order, and the conversation_id index
    // (which InnoDB extends with the id) serves it without a sort.
    List<Message> findByConversationIdOrderByIdAsc(Long conversationId);

    // Only what an open chat hasn't seen yet, for its polling.
    List<Message> findByConversationIdAndIdGreaterThanOrderByIdAsc(Long conversationId, Long afterId);

    // Every message in any conversation the user takes part in
    @Modifying
    @Query("delete from Message m where m.conversation.id in " +
            "(select c.id from Conversation c where c.firstUser.id = :userId or c.secondUser.id = :userId)")
    void deleteAllInvolvingUser(@Param("userId") Long userId);

    @Query("select max(m.id) from Message m where m.conversation.id = :conversationId")
    Long findLatestId(@Param("conversationId") Long conversationId);

    // [conversationId, unreadCount] for every conversation with messages from the
    // other participant that are newer than what the user has read, and newer
    // than the user's own latest reply (replying implies you saw what came before;
    // this also covers chats from before read tracking existed).
    @Query("select c.id, count(m) from Message m join m.conversation c " +
            "where m.user.id <> :userId and (" +
            "(c.firstUser.id = :userId and m.id > coalesce(c.firstUserLastReadId, 0)) or " +
            "(c.secondUser.id = :userId and m.id > coalesce(c.secondUserLastReadId, 0))) " +
            "and m.id > (select coalesce(max(own.id), 0) from Message own " +
            "            where own.conversation = c and own.user.id = :userId) " +
            "group by c.id")
    List<Object[]> countUnreadByConversation(@Param("userId") Long userId);
}
