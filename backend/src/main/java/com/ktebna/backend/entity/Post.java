package com.ktebna.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "posts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Post {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "book_name", nullable = false, length = 200)
    private String bookName;

    @Column(name = "book_category", length = 100)
    private String bookCategory;

    @Column(name = "book_deal", length = 200)
    private String bookDeal;

    @Column(name = "book_deal_type", length = 30)
    private String bookDealType;

    @Column(name = "book_image", length = 500)
    private String bookImage;

    @Column(name = "book_location", length = 100)
    private String bookLocation;

    @Column(name = "is_public", nullable = false)
    private boolean isPublic = true;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
