package com.ktebna.backend.repository;

import com.ktebna.backend.entity.SavedPost;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

public interface SavedPostRepository extends JpaRepository<SavedPost, Long> {
    Page<SavedPost> findByUserIdAndPost_IsPublicTrue(Long userId, Pageable pageable);
    List<SavedPost> findByUserId(Long userId);
    Optional<SavedPost> findByUserIdAndPostId(Long userId, Long postId);
    long countByUserId(Long userId);
    @Modifying
    @Transactional
    @Query("delete from SavedPost sp where sp.user.id = :userId and sp.post.id = :postId")
    void deleteByUserIdAndPostId(@Param("userId") Long userId, @Param("postId") Long postId);

    @Modifying
    @Query("delete from SavedPost sp where sp.post.id = :postId")
    void deleteAllForPost(@Param("postId") Long postId);

    // Bookmarks made by the user, and bookmarks others made on the user's posts
    @Modifying
    @Query("delete from SavedPost sp where sp.user.id = :userId " +
            "or sp.post.id in (select p.id from Post p where p.user.id = :userId)")
    void deleteAllInvolvingUser(@Param("userId") Long userId);
}
