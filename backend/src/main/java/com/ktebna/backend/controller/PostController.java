package com.ktebna.backend.controller;

import com.ktebna.backend.dto.PostForm;
import com.ktebna.backend.dto.PostResponse;
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
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
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
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {

        Page<Post> result = postRepository.findPublicFeed(
                blankToNull(category), blankToNull(dealType), blankToNull(location),
                search == null || search.isBlank() ? null : search.trim(),
                Paging.of(page, size));

        return Map.of(
                "data", result.getContent().stream().map(this::toResponse).toList(),
                "count", result.getTotalElements(),
                "totalPages", result.getTotalPages()
        );
    }

    @GetMapping("/{id}")
    public PostResponse getOne(@AuthenticationPrincipal User currentUser, @PathVariable Long id) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new ApiException("Post not found", HttpStatus.NOT_FOUND));
        // Hidden listings are visible to their owner only; everyone else gets the
        // same 404 as for a missing post, so ids can't be probed.
        boolean owner = currentUser != null && post.getUser().getId().equals(currentUser.getId());
        if (!post.isPublic() && !owner) {
            throw new ApiException("Post not found", HttpStatus.NOT_FOUND);
        }
        return toResponse(post);
    }

    // Own posts (includes private), paginated
    @GetMapping("/me")
    public Map<String, Object> getMyPosts(@AuthenticationPrincipal User currentUser,
                                           @RequestParam(defaultValue = "0") int page,
                                           @RequestParam(defaultValue = "12") int size) {
        // GET /api/posts/** is public in SecurityConfig, so check auth here.
        if (currentUser == null) {
            throw new ApiException("Authentication required", HttpStatus.UNAUTHORIZED);
        }
        Page<Post> result = postRepository.findByUserIdOrderByCreatedAtDesc(
                currentUser.getId(), Paging.of(page, size));
        return Map.of(
                "data", result.getContent().stream().map(this::toResponse).toList(),
                "count", result.getTotalElements(),
                "totalPages", result.getTotalPages()
        );
    }

    @PostMapping(consumes = "multipart/form-data")
    public PostResponse create(@AuthenticationPrincipal User currentUser, @Valid PostForm form) {
        Post post = new Post();
        post.setUser(currentUser);
        post.setPublic(form.getIsPublic() == null || form.getIsPublic());
        return save(post, form);
    }

    @PutMapping(value = "/{id}", consumes = "multipart/form-data")
    public PostResponse update(@AuthenticationPrincipal User currentUser,
                                @PathVariable Long id,
                                @Valid PostForm form) {
        Post post = getOwnedPost(currentUser, id);
        if (form.getIsPublic() != null) {
            post.setPublic(form.getIsPublic());
        }
        return save(post, form);
    }

    // Shared by create and update: copy the form, store a new image if one was sent.
    private PostResponse save(Post post, PostForm form) {
        post.setBookName(form.getBookName());
        post.setBookAuthor(form.getBookAuthor());
        post.setBookCategory(form.getBookCategory());
        post.setBookDeal(form.getBookDeal());
        post.setBookDealType(form.getBookDealType());
        post.setBookLocation(form.getBookLocation());
        post.setBookCondition(form.getBookCondition());
        post.setBookDescription(form.getBookDescription());
        applyPickup(post, form.getPickupLat(), form.getPickupLng(), form.getPickupSpot());

        MultipartFile image = form.getImage();
        if (image != null && !image.isEmpty()) {
            post.setBookImage(fileStorageService.store(image));
        }
        return toResponse(postRepository.save(post));
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
    @Transactional
    public void delete(@AuthenticationPrincipal User currentUser, @PathVariable Long id) {
        Post post = getOwnedPost(currentUser, id);
        // Other readers' bookmarks reference the post; drop them first.
        savedPostRepository.deleteAllForPost(post.getId());
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

    // A pin needs both coordinates inside valid ranges; otherwise it is cleared.
    private void applyPickup(Post post, Double lat, Double lng, String spot) {
        boolean valid = lat != null && lng != null
                && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
        post.setPickupLat(valid ? lat : null);
        post.setPickupLng(valid ? lng : null);
        post.setPickupSpot(valid && spot != null && !spot.isBlank()
                ? spot.trim().substring(0, Math.min(spot.trim().length(), 200)) : null);
    }

    private PostResponse toResponse(Post post) {
        return PostResponse.from(post);
    }
}
