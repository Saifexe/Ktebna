package com.ktebna.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SendMessageRequest {
    @NotNull
    private Long otherUserId;
    @Size(max = 200)
    private String bookName;
    @NotBlank
    @Size(max = 2000)
    private String messageContent;
}
