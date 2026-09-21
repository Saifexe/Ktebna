package com.ktebna.backend.controller;

import com.ktebna.backend.dto.PostResponse;
import com.ktebna.backend.entity.Post;
import com.ktebna.backend.entity.SavedPost;
import com.ktebna.backend.entity.User;
import com.ktebna.backend.exception.ApiException;
import com.ktebna.backend.repository.PostRepository;
import com.ktebna.backend.repository.SavedPostRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/saved-posts")
@RequiredArgsConstructor
public class SavedPostController {

    private static final int MAX_SAVED_POSTS = 6;

    private final SavedPostRepository savedPostRepository;
    private final PostRepository postRepository;

    @GetMapping
    public Map<String, Object> getSavedPosts(@AuthenticationPrincipal User currentUser,
                                              @RequestParam(defaultValue = "0") int page,
                                              @RequestParam(defaultValue = "12") int size) {
        Page<SavedPost> result = savedPostRepository.findByUserIdAndPost_IsPublicTrue(
                currentUser.getId(), PageRequest.of(page, size));

        List<PostResponse> data = result.getContent().stream()
                .map(sp -> PostResponse.from(sp.getPost()))
                .toList();

        return Map.of(
                "data", data,
                "count", result.getTotalElements(),
                "totalPages", result.getTotalPages()
        );
    }

    // Lightweight list of saved post ids, used to mark cards as saved on the home feed
    @GetMapping("/ids")
    public List<Long> getSavedPostIds(@AuthenticationPrincipal User currentUser) {
        return savedPostRepository.findByUserId(currentUser.getId()).stream()
                .map(sp -> sp.getPost().getId())
                .toList();
    }

    @PostMapping("/{postId}")
    public void savePost(@AuthenticationPrincipal User currentUser, @PathVariable Long postId) {
        if (savedPostRepository.findByUserIdAndPostId(currentUser.getId(), postId).isPresent()) {
            return; // already saved, no-op
        }
        long count = savedPostRepository.countByUserId(currentUser.getId());
        if (count >= MAX_SAVED_POSTS) {
            throw new ApiException("Maximum of " + MAX_SAVED_POSTS + " saved posts reached", HttpStatus.BAD_REQUEST);
        }
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ApiException("Post not found", HttpStatus.NOT_FOUND));

        SavedPost sp = new SavedPost();
        sp.setUser(currentUser);
        sp.setPost(post);
        savedPostRepository.save(sp);
    }

    @DeleteMapping("/{postId}")
    public void unsavePost(@AuthenticationPrincipal User currentUser, @PathVariable Long postId) {
        savedPostRepository.deleteByUserIdAndPostId(currentUser.getId(), postId);
    }
}
