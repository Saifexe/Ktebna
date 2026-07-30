package com.ktebna.backend.controller;

import com.ktebna.backend.dto.PostRequest;
import com.ktebna.backend.dto.PostResponse;
import com.ktebna.backend.dto.UserDto;
import com.ktebna.backend.dto.VisibilityRequest;
import com.ktebna.backend.entity.Post;
import com.ktebna.backend.entity.User;
import com.ktebna.backend.exception.ApiException;
import com.ktebna.backend.repository.PostRepository;
import com.ktebna.backend.repository.SavedPostRepository;
import com.ktebna.backend.service.FileStorageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostRepository postRepository;
    private final SavedPostRepository savedPostRepository;
    private final FileStorageService fileStorageService;

    // Public feed - anyone can browse
    @GetMapping
    public Map<String, Object> getFeed(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String dealType,
            @RequestParam(required = false) String location,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {

        Page<Post> result = postRepository.findPublicFeed(
                blankToNull(category), blankToNull(dealType), blankToNull(location),
                PageRequest.of(page, size));

        return Map.of(
                "data", result.getContent().stream().map(this::toResponse).toList(),
                "count", result.getTotalElements(),
                "totalPages", result.getTotalPages()
        );
    }

    @GetMapping("/{id}")
    public PostResponse getOne(@PathVariable Long id) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new ApiException("Post not found", HttpStatus.NOT_FOUND));
        return toResponse(post);
    }

    // Own posts (includes private), paginated
    @GetMapping("/me")
    public Map<String, Object> getMyPosts(@AuthenticationPrincipal User currentUser,
                                           @RequestParam(defaultValue = "0") int page,
                                           @RequestParam(defaultValue = "12") int size) {
        Page<Post> result = postRepository.findByUserIdOrderByCreatedAtDesc(
                currentUser.getId(), PageRequest.of(page, size));
        return Map.of(
                "data", result.getContent().stream().map(this::toResponse).toList(),
                "count", result.getTotalElements(),
                "totalPages", result.getTotalPages()
        );
    }

    @PostMapping(consumes = "multipart/form-data")
    public PostResponse create(@AuthenticationPrincipal User currentUser,
                                @RequestParam("bookName") String bookName,
                                @RequestParam(value = "bookCategory", required = false) String bookCategory,
                                @RequestParam(value = "bookDeal", required = false) String bookDeal,
                                @RequestParam(value = "bookDealType", required = false) String bookDealType,
                                @RequestParam(value = "bookLocation", required = false) String bookLocation,
                                @RequestParam(value = "image", required = false) MultipartFile image) {
        Post post = new Post();
        post.setUser(currentUser);
        post.setBookName(bookName);
        post.setBookCategory(bookCategory);
        post.setBookDeal(bookDeal);
        post.setBookDealType(bookDealType);
        post.setBookLocation(bookLocation);
        post.setPublic(true);

        if (image != null && !image.isEmpty()) {
            post.setBookImage(fileStorageService.store(image));
        }

        Post saved = postRepository.save(post);
        return toResponse(saved);
    }

    @PutMapping(value = "/{id}", consumes = "multipart/form-data")
    public PostResponse update(@AuthenticationPrincipal User currentUser,
                                @PathVariable Long id,
                                @RequestParam("bookName") String bookName,
                                @RequestParam(value = "bookCategory", required = false) String bookCategory,
                                @RequestParam(value = "bookDeal", required = false) String bookDeal,
                                @RequestParam(value = "bookDealType", required = false) String bookDealType,
                                @RequestParam(value = "bookLocation", required = false) String bookLocation,
                                @RequestParam(value = "image", required = false) MultipartFile image) {
        Post post = getOwnedPost(currentUser, id);

        post.setBookName(bookName);
        post.setBookCategory(bookCategory);
        post.setBookDeal(bookDeal);
        post.setBookDealType(bookDealType);
        post.setBookLocation(bookLocation);

        if (image != null && !image.isEmpty()) {
            post.setBookImage(fileStorageService.store(image));
        }

        Post saved = postRepository.save(post);
        return toResponse(saved);
    }

    @PatchMapping("/{id}/visibility")
    public PostResponse updateVisibility(@AuthenticationPrincipal User currentUser,
                                          @PathVariable Long id,
                                          @Valid @RequestBody VisibilityRequest req) {
        Post post = getOwnedPost(currentUser, id);
        post.setPublic(req.isPublic());
        Post saved = postRepository.save(post);
        return toResponse(saved);
    }

    @DeleteMapping("/{id}")
    public void delete(@AuthenticationPrincipal User currentUser, @PathVariable Long id) {
        Post post = getOwnedPost(currentUser, id);
        postRepository.delete(post);
    }

    private Post getOwnedPost(User currentUser, Long id) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new ApiException("Post not found", HttpStatus.NOT_FOUND));
        if (!post.getUser().getId().equals(currentUser.getId())) {
            throw new ApiException("You do not own this post", HttpStatus.FORBIDDEN);
        }
        return post;
    }

    private String blankToNull(String s) {
        return (s == null || s.isBlank() || s.equalsIgnoreCase("All") || s.equalsIgnoreCase("allTunisia")) ? null : s;
    }

    private PostResponse toResponse(Post post) {
        User u = post.getUser();
        UserDto userDto = new UserDto(u.getId(), u.getName(), u.getEmail(), u.getProfilePicture());
        return new PostResponse(
                post.getId(), post.getBookName(), post.getBookCategory(), post.getBookDeal(),
                post.getBookDealType(), post.getBookImage(), post.getBookLocation(),
                post.isPublic(), post.getCreatedAt(), userDto
        );
    }
}
