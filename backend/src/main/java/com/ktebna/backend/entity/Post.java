package com.ktebna.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;

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

    @Column(name = "book_author", length = 200)
    private String bookAuthor;

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

    // One of: likeNew, gentlyRead, wellLoved, collectors (free text tolerated)
    @Column(name = "book_condition", length = 30)
    private String bookCondition;

    // Seller notes: condition details, swap wishlist, pickup preferences
    @Column(name = "book_description", length = 2000)
    private String bookDescription;

    // Optional pickup pin chosen on the map (a public meeting place, not a home address)
    @Column(name = "pickup_lat")
    private Double pickupLat;

    @Column(name = "pickup_lng")
    private Double pickupLng;

    @Column(name = "pickup_spot", length = 200)
    private String pickupSpot;

    @Column(name = "is_public", nullable = false)
    private boolean isPublic = true;

    // VARCHAR rather than MySQL's native ENUM, so adding a status later needs no
    // ALTER; the default fills in existing rows when Hibernate adds the column.
    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @ColumnDefault("'AVAILABLE'")
    @Column(name = "status", nullable = false, length = 20)
    private PostStatus status = PostStatus.AVAILABLE;

    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = Instant.now();
    }
}
