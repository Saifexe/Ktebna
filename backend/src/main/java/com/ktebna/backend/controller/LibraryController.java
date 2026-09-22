package com.ktebna.backend.controller;

import com.ktebna.backend.dto.LibraryBookForm;
import com.ktebna.backend.dto.LibraryBookResponse;
import com.ktebna.backend.entity.LibraryBook;
import com.ktebna.backend.entity.User;
import com.ktebna.backend.exception.ApiException;
import com.ktebna.backend.repository.LibraryBookRepository;
import com.ktebna.backend.service.FileStorageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

// The free Library: readers share links to PDFs that are free to read.
@RestController
@RequestMapping("/api/library")
@RequiredArgsConstructor
public class LibraryController {

    private final LibraryBookRepository libraryBookRepository;
    private final FileStorageService fileStorageService;

    // Public, like the marketplace feed
    @GetMapping
    public Map<String, Object> list(@RequestParam(required = false) String language,
                                    @RequestParam(required = false) String category,
                                    @RequestParam(required = false) String search,
                                    @RequestParam(defaultValue = "0") int page,
                                    @RequestParam(defaultValue = "24") int size) {
        Page<LibraryBook> result = libraryBookRepository.search(
                blankToNull(language), blankToNull(category), blankToNull(search), Paging.of(page, size));
        return Map.of(
                "data", result.getContent().stream().map(LibraryBookResponse::from).toList(),
                "count", result.getTotalElements(),
                "totalPages", result.getTotalPages()
        );
    }

    @GetMapping("/{id}")
    public LibraryBookResponse getOne(@PathVariable Long id) {
        return LibraryBookResponse.from(find(id));
    }

    @PostMapping(consumes = "multipart/form-data")
    public LibraryBookResponse create(@AuthenticationPrincipal User currentUser, @Valid LibraryBookForm form) {
        LibraryBook book = new LibraryBook();
        book.setUser(currentUser);
        book.setTitle(form.getTitle().trim());
        book.setAuthor(trimToNull(form.getAuthor()));
        book.setLanguage(form.getLanguage());
        book.setCategory(trimToNull(form.getCategory()));
        book.setDescription(trimToNull(form.getDescription()));
        book.setPdfUrl(form.getPdfUrl().trim());
        MultipartFile image = form.getImage();
        if (image != null && !image.isEmpty()) {
            book.setCoverImage(fileStorageService.store(image));
        }
        return LibraryBookResponse.from(libraryBookRepository.save(book));
    }

    @DeleteMapping("/{id}")
    public void delete(@AuthenticationPrincipal User currentUser, @PathVariable Long id) {
        LibraryBook book = find(id);
        if (!book.getUser().getId().equals(currentUser.getId())) {
            throw new ApiException("You did not share this book", HttpStatus.FORBIDDEN);
        }
        libraryBookRepository.delete(book);
    }

    private LibraryBook find(Long id) {
        return libraryBookRepository.findById(id)
                .orElseThrow(() -> new ApiException("Book not found", HttpStatus.NOT_FOUND));
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() || s.equalsIgnoreCase("All") ? null : s.trim();
    }

    private static String trimToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}
