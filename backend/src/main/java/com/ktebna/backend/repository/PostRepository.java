package com.ktebna.backend.repository;

import com.ktebna.backend.entity.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PostRepository extends JpaRepository<Post, Long> {

    Page<Post> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    @Query("select p from Post p where p.isPublic = true " +
            "and (:category is null or p.bookCategory = :category) " +
            "and (:dealType is null or p.bookDealType = :dealType) " +
            "and (:location is null or p.bookLocation = :location) " +
            "order by p.createdAt desc")
    Page<Post> findPublicFeed(@Param("category") String category,
                              @Param("dealType") String dealType,
                              @Param("location") String location,
                              Pageable pageable);
}
