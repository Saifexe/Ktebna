package com.ktebna.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateNameRequest {
    @NotBlank
    private String name;
}
