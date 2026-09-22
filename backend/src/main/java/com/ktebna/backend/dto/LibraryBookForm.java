package com.ktebna.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import org.springframework.web.multipart.MultipartFile;

/** Multipart form sent by "Share a book" (POST /api/library). */
@Getter
@Setter
public class LibraryBookForm {
    @NotBlank
    @Size(max = 200)
    private String title;
    @Size(max = 200)
    private String author;
    @NotBlank
    @Pattern(regexp = "en|fr|ar", message = "must be en, fr or ar")
    private String language;
    @Size(max = 100)
    private String category;
    @Size(max = 2000)
    private String description;
    // http(s) only: other readers open this link, so no javascript: or data: URLs.
    @NotBlank
    @Size(max = 500)
    @Pattern(regexp = "(?i)\\s*https?://\\S+\\s*", message = "must be an http(s) link")
    private String pdfUrl;
    private MultipartFile image;
}
