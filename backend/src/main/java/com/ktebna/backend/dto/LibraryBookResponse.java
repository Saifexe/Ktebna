package com.ktebna.backend.dto;

import com.ktebna.backend.entity.LibraryBook;
import com.ktebna.backend.entity.User;

import java.time.Instant;

public record LibraryBookResponse(Long id, String title, String author, String language, String category,
                                  String description, String coverImage, String pdfUrl,
                                  Instant createdAt, UserDto user) {

    public static LibraryBookResponse from(LibraryBook book) {
        User u = book.getUser();
        // Public page: the sharer's name and avatar, never their email.
        return new LibraryBookResponse(book.getId(), book.getTitle(), book.getAuthor(), book.getLanguage(),
                book.getCategory(), book.getDescription(), book.getCoverImage(), book.getPdfUrl(),
                book.getCreatedAt(), new UserDto(u.getId(), u.getName(), null, u.getProfilePicture()));
    }
}
