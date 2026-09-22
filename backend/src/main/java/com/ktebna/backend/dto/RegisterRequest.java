package com.ktebna.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RegisterRequest {
    @NotBlank
    @Size(max = 120)
    private String name;

    @NotBlank
    @Email
    @Size(max = 180)
    private String email;

    // BCrypt only reads the first 72 bytes and rejects longer input.
    @NotBlank
    @Size(min = 6, max = 72, message = "Password must be 6 to 72 characters")
    private String password;
}
