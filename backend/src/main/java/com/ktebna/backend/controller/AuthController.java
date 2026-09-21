package com.ktebna.backend.controller;

import com.ktebna.backend.dto.*;
import com.ktebna.backend.entity.User;
import com.ktebna.backend.exception.ApiException;
import com.ktebna.backend.repository.UserRepository;
import com.ktebna.backend.security.JwtUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @PostMapping("/register")
    public AuthResponse register(@Valid @RequestBody RegisterRequest req) {
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new ApiException("An account with this email already exists", HttpStatus.CONFLICT);
        }
        User user = new User();
        user.setName(req.getName());
        user.setEmail(req.getEmail().toLowerCase());
        user.setPassword(passwordEncoder.encode(req.getPassword()));
        user = userRepository.save(user);

        String token = jwtUtil.generateToken(user.getId(), user.getEmail());
        return new AuthResponse(token, toDto(user));
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest req) {
        User user = userRepository.findByEmail(req.getEmail().toLowerCase()).orElse(null);

        // Always run one BCrypt check so response time doesn't reveal whether
        // the email is registered.
        String hash = user != null ? user.getPassword() : dummyHash();
        if (!passwordEncoder.matches(req.getPassword(), hash) || user == null) {
            throw new ApiException("Invalid email or password", HttpStatus.UNAUTHORIZED);
        }

        String token = jwtUtil.generateToken(user.getId(), user.getEmail());
        return new AuthResponse(token, toDto(user));
    }

    @GetMapping("/me")
    public UserDto me(@org.springframework.security.core.annotation.AuthenticationPrincipal User user) {
        if (user == null) {
            throw new ApiException("Not authenticated", HttpStatus.UNAUTHORIZED);
        }
        return toDto(user);
    }

    private volatile String dummyHash;

    private String dummyHash() {
        if (dummyHash == null) {
            dummyHash = passwordEncoder.encode("timing-equalizer-" + System.nanoTime());
        }
        return dummyHash;
    }

    private UserDto toDto(User user) {
        return new UserDto(user.getId(), user.getName(), user.getEmail(), user.getProfilePicture());
    }
}
