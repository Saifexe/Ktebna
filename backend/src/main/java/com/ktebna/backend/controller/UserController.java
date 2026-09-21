package com.ktebna.backend.controller;

import com.ktebna.backend.dto.UpdateNameRequest;
import com.ktebna.backend.dto.UserDto;
import com.ktebna.backend.entity.User;
import com.ktebna.backend.exception.ApiException;
import com.ktebna.backend.repository.ConversationRepository;
import com.ktebna.backend.repository.MessageRepository;
import com.ktebna.backend.repository.PostRepository;
import com.ktebna.backend.repository.SavedPostRepository;
import com.ktebna.backend.repository.UserRepository;
import com.ktebna.backend.service.FileStorageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final SavedPostRepository savedPostRepository;
    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final FileStorageService fileStorageService;

    @GetMapping("/users/{id}")
    public UserDto getUser(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ApiException("User not found", HttpStatus.NOT_FOUND));
        return toDto(user);
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
        String url = fileStorageService.store(file);
        currentUser.setProfilePicture(url);
        User saved = userRepository.save(currentUser);
        return toDto(saved);
    }

    // Children first, so no foreign key still points at the user or their posts.
    @DeleteMapping("/account")
    @Transactional
    public void deleteAccount(@AuthenticationPrincipal User currentUser) {
        Long userId = currentUser.getId();
        savedPostRepository.deleteAllInvolvingUser(userId);
        messageRepository.deleteAllInvolvingUser(userId);
        conversationRepository.deleteAllInvolvingUser(userId);
        postRepository.deleteAllByOwner(userId);
        userRepository.deleteById(userId);
    }

    private UserDto toDto(User user) {
        return new UserDto(user.getId(), user.getName(), user.getEmail(), user.getProfilePicture());
    }
}
