package com.ktebna.backend.repository;

import com.ktebna.backend.entity.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PostRepository extends JpaRepository<Post, Long> {

    Page<Post> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    @Modifying
    @Query("delete from Post p where p.user.id = :userId")
    void deleteAllByOwner(@Param("userId") Long userId);

    // Finished deals (SOLD) leave the feed; they stay reachable by link and in
    // their owner's and savers' lists.
    @Query("select p from Post p where p.isPublic = true " +
            "and p.status <> com.ktebna.backend.entity.PostStatus.SOLD " +
            "and (:category is null or p.bookCategory = :category) " +
            "and (:dealType is null or p.bookDealType = :dealType) " +
            "and (:location is null or p.bookLocation = :location) " +
            "and (:search is null or lower(p.bookName) like lower(concat('%', :search, '%')) " +
            "     or lower(p.bookAuthor) like lower(concat('%', :search, '%'))) " +
            "order by p.createdAt desc")
    Page<Post> findPublicFeed(@Param("category") String category,
                              @Param("dealType") String dealType,
                              @Param("location") String location,
                              @Param("search") String search,
                              Pageable pageable);
}
