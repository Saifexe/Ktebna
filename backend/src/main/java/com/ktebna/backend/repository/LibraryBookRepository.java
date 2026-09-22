package com.ktebna.backend.repository;

import com.ktebna.backend.entity.LibraryBook;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface LibraryBookRepository extends JpaRepository<LibraryBook, Long> {

    String FILTERS = "(:language is null or b.language = :language) " +
            "and (:category is null or b.category = :category) " +
            "and (:search is null or lower(b.title) like lower(concat('%', :search, '%')) " +
            "     or lower(b.author) like lower(concat('%', :search, '%')))";

    // join fetch: one query for the page, not one extra per sharer
    @Query(value = "select b from LibraryBook b join fetch b.user where " + FILTERS + " order by b.createdAt desc",
            countQuery = "select count(b) from LibraryBook b where " + FILTERS)
    Page<LibraryBook> search(@Param("language") String language,
                             @Param("category") String category,
                             @Param("search") String search,
                             Pageable pageable);

    @Modifying
    @Query("delete from LibraryBook b where b.user.id = :userId")
    void deleteAllByOwner(@Param("userId") Long userId);
}
