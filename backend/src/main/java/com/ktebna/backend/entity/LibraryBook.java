package com.ktebna.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

// A free-to-read book in the Library: a cover uploaded to the platform plus a
// link to a PDF that is legally free to read (public domain or a publisher's
// own excerpt). Unlike posts, nothing is sold or swapped.
@Entity
@Table(name = "library_books")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class LibraryBook {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Who shared it
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(length = 200)
    private String author;

    // One of: en, fr, ar
    @Column(nullable = false, length = 5)
    private String language;

    @Column(length = 100)
    private String category;

    @Column(length = 2000)
    private String description;

    @Column(name = "cover_image", length = 500)
    private String coverImage;

    @Column(name = "pdf_url", nullable = false, length = 500)
    private String pdfUrl;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
