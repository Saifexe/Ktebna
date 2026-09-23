package com.ktebna.backend.dto;

import com.ktebna.backend.entity.PostStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class StatusRequest {
    // Unknown values fail JSON parsing and come back as a 400.
    @NotNull
    private PostStatus status;
}
