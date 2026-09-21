package com.ktebna.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import org.springframework.web.multipart.MultipartFile;

/**
 * Multipart form sent by the "List a Book" flow, shared by create and update
 * (POST /api/posts and PUT /api/posts/{id}). Field names match the form keys.
 */
@Getter
@Setter
public class PostForm {
    @NotBlank
    @Size(max = 200)
    private String bookName;
    private String bookAuthor;
    private String bookCategory;
    private String bookDeal;
    private String bookDealType;
    private String bookLocation;
    private String bookCondition;
    private String bookDescription;
    private Double pickupLat;
    private Double pickupLng;
    private String pickupSpot;
    // Boolean wrapper: null means "leave unchanged" on update, "public" on create.
    private Boolean isPublic;
    private MultipartFile image;
}
