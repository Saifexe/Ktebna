package com.ktebna.backend.controller;

import com.ktebna.backend.dto.PostResponse;
import com.ktebna.backend.dto.PublicProfile;
import com.ktebna.backend.dto.UpdateNameRequest;
import com.ktebna.backend.dto.UserDto;
import com.ktebna.backend.entity.Post;
import com.ktebna.backend.entity.PostStatus;
import com.ktebna.backend.entity.User;
import com.ktebna.backend.exception.ApiException;
import com.ktebna.backend.repository.ConversationRepository;
import com.ktebna.backend.repository.LibraryBookRepository;
import com.ktebna.backend.repository.MessageRepository;
import com.ktebna.backend.repository.PostRepository;
import com.ktebna.backend.repository.SavedPostRepository;
import com.ktebna.backend.repository.UserRepository;
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
@RequestMapping("/api")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final LibraryBookRepository libraryBookRepository;
    private final SavedPostRepository savedPostRepository;
    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final FileStorageService fileStorageService;

    @GetMapping("/users/{id}")
    public UserDto getUser(@AuthenticationPrincipal User currentUser, @PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ApiException("User not found", HttpStatus.NOT_FOUND));
        // Email is only returned to the account owner.
        boolean self = currentUser != null && currentUser.getId().equals(id);
        return new UserDto(user.getId(), user.getName(), self ? user.getEmail() : null, user.getProfilePicture());
    }

    // Public profile page: open to visitors (see SecurityConfig), never the email.
    @GetMapping("/users/{id}/profile")
    public PublicProfile getPublicProfile(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ApiException("User not found", HttpStatus.NOT_FOUND));
        long active = postRepository.findPublicByOwner(id, Paging.of(0, 1)).getTotalElements();
        long completed = postRepository.countByUserIdAndStatus(id, PostStatus.SOLD);
        return new PublicProfile(user.getId(), user.getName(), user.getProfilePicture(),
                user.getCreatedAt(), active, completed);
    }

    // The books a reader currently offers: public and not yet sold.
    @GetMapping("/users/{id}/posts")
    public Map<String, Object> getPublicPosts(@PathVariable Long id,
                                              @RequestParam(defaultValue = "0") int page,
                                              @RequestParam(defaultValue = "12") int size) {
        if (!userRepository.existsById(id)) {
            throw new ApiException("User not found", HttpStatus.NOT_FOUND);
        }
        Page<Post> result = postRepository.findPublicByOwner(id, Paging.of(page, size));
        return Map.of(
                "data", result.getContent().stream().map(PostResponse::from).toList(),
                "count", result.getTotalElements(),
                "totalPages", result.getTotalPages()
        );
    }

    @PutMapping("/account/name")
    public UserDto updateName(@AuthenticationPrincipal User currentUser,
                               @Valid @RequestBody UpdateNameRequest req) {
        currentUser.setName(req.getName());
        User saved = userRepository.save(currentUser);
        return toDto(saved);
    }

    @PostMapping(value = "/account/profile-picture", consumes = "multipart/form-data")
    public UserDto updateProfilePicture(@AuthenticationPrincipal User currentUser,
                                         @RequestParam("file") MultipartFile file) {
        String previous = currentUser.getProfilePicture();
        String url = fileStorageService.store(file);
        currentUser.setProfilePicture(url);
        User saved = userRepository.save(currentUser);
        fileStorageService.deleteLater(previous);
        return toDto(saved);
    }

    // Children first, so no foreign key still points at the user or their posts.
    @DeleteMapping("/account")
    @Transactional
    public void deleteAccount(@AuthenticationPrincipal User currentUser) {
        Long userId = currentUser.getId();
        // Their photos go too (after the commit): covers, shared-book covers, avatar.
        postRepository.findImagesByOwner(userId).forEach(fileStorageService::deleteLater);
        libraryBookRepository.findCoversByOwner(userId).forEach(fileStorageService::deleteLater);
        fileStorageService.deleteLater(currentUser.getProfilePicture());
        savedPostRepository.deleteAllInvolvingUser(userId);
        messageRepository.deleteAllInvolvingUser(userId);
        conversationRepository.deleteAllInvolvingUser(userId);
        libraryBookRepository.deleteAllByOwner(userId);
        postRepository.deleteAllByOwner(userId);
        userRepository.deleteById(userId);
    }

    private UserDto toDto(User user) {
        return new UserDto(user.getId(), user.getName(), user.getEmail(), user.getProfilePicture());
    }
}
