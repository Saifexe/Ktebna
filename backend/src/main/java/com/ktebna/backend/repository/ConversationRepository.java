package com.ktebna.backend.repository;

import com.ktebna.backend.entity.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ConversationRepository extends JpaRepository<Conversation, Long> {

    @Query("select c from Conversation c where " +
            "(c.firstUser.id = :userA and c.secondUser.id = :userB) or " +
            "(c.firstUser.id = :userB and c.secondUser.id = :userA)")
    Optional<Conversation> findBetweenUsers(@Param("userA") Long userA, @Param("userB") Long userB);

    @Query("select c from Conversation c where c.firstUser.id = :userId or c.secondUser.id = :userId " +
            "order by c.updatedAt desc")
    List<Conversation> findAllForUser(@Param("userId") Long userId);
}
