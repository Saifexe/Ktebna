package com.ktebna.backend.dto;

import java.time.Instant;

// What any visitor may see about a reader. Deliberately no email address.
public record PublicProfile(
        Long id,
        String name,
        String profilePicture,
        Instant memberSince,
        long activeListings,
        long completedDeals) {
}
