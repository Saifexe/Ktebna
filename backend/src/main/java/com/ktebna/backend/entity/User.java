package com.ktebna.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;

import java.time.Instant;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(nullable = false, unique = true, length = 180)
    private String email;

    @Column(name = "password", nullable = false)
    private String password;

    @Column(name = "profile_picture", length = 500)
    private String profilePicture;

    // Part of every login token. Raising it revokes all the user's existing
    // tokens at once ("log out everywhere", or an operator locking out a
    // compromised account): UPDATE users SET token_version = token_version + 1 WHERE id = ?
    @ColumnDefault("0")
    @Column(name = "token_version", nullable = false)
    private int tokenVersion = 0;

    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = Instant.now();
        if (this.profilePicture == null) {
            this.profilePicture = "";
        }
    }
}
