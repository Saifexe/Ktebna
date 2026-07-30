package com.ktebna.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PostRequest {
    @NotBlank
    private String bookName;
    private String bookCategory;
    private String bookDeal;
    private String bookDealType;
    private String bookLocation;
    // image URL is set server-side after file upload; kept here for updates without a new image
    private String bookImage;
}
