package com.ktebna.backend.controller;

import com.ktebna.backend.dto.PageResponse;
import com.ktebna.backend.dto.PostForm;
import com.ktebna.backend.dto.PostResponse;
import com.ktebna.backend.dto.StatusRequest;
import com.ktebna.backend.dto.VisibilityRequest;
import com.ktebna.backend.entity.User;
import com.ktebna.backend.exception.ApiException;
import com.ktebna.backend.service.PostService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;

    // Public feed - anyone can browse
    @GetMapping
    public PageResponse<PostResponse> getFeed(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String dealType,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        return PageResponse.of(postService.feed(category, dealType, location, search, Paging.of(page, size)));
    }

    @GetMapping("/{id}")
    public PostResponse getOne(@AuthenticationPrincipal User currentUser, @PathVariable Long id) {
        return postService.getVisible(currentUser, id);
    }

    // Own posts (includes private), paginated
    @GetMapping("/me")
    public PageResponse<PostResponse> getMyPosts(@AuthenticationPrincipal User currentUser,
                                                 @RequestParam(defaultValue = "0") int page,
                                                 @RequestParam(defaultValue = "12") int size) {
        // GET /api/posts/** is public in SecurityConfig, so check auth here.
        if (currentUser == null) {
            throw new ApiException("Authentication required", HttpStatus.UNAUTHORIZED);
        }
        return PageResponse.of(postService.mine(currentUser, Paging.of(page, size)));
    }

    @PostMapping(consumes = "multipart/form-data")
    public PostResponse create(@AuthenticationPrincipal User currentUser, @Valid PostForm form) {
        return postService.create(currentUser, form);
    }

    @PutMapping(value = "/{id}", consumes = "multipart/form-data")
    public PostResponse update(@AuthenticationPrincipal User currentUser,
                               @PathVariable Long id,
                               @Valid PostForm form) {
        return postService.update(currentUser, id, form);
    }

    @PatchMapping("/{id}/visibility")
    public PostResponse updateVisibility(@AuthenticationPrincipal User currentUser,
                                         @PathVariable Long id,
                                         @Valid @RequestBody VisibilityRequest req) {
        return postService.setVisibility(currentUser, id, req.isPublic());
    }

    @PatchMapping("/{id}/status")
    public PostResponse updateStatus(@AuthenticationPrincipal User currentUser,
                                     @PathVariable Long id,
                                     @Valid @RequestBody StatusRequest req) {
        return postService.setStatus(currentUser, id, req.getStatus());
    }

    @DeleteMapping("/{id}")
    public void delete(@AuthenticationPrincipal User currentUser, @PathVariable Long id) {
        postService.delete(currentUser, id);
    }
}
