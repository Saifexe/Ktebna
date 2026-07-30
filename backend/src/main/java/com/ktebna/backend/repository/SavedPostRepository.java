package com.ktebna.backend.repository;

import com.ktebna.backend.entity.SavedPost;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SavedPostRepository extends JpaRepository<SavedPost, Long> {
    Page<SavedPost> findByUserIdAndPost_IsPublicTrue(Long userId, Pageable pageable);
    List<SavedPost> findByUserId(Long userId);
    Optional<SavedPost> findByUserIdAndPostId(Long userId, Long postId);
    long countByUserId(Long userId);
    void deleteByUserIdAndPostId(Long userId, Long postId);
}
