package com.ktebna.backend.dto;

import java.time.LocalDateTime;

// What any visitor may see about a reader. Deliberately no email address.
public record PublicProfile(
        Long id,
        String name,
        String profilePicture,
        LocalDateTime memberSince,
        long activeListings,
        long completedDeals) {
}
