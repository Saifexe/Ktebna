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
    // Limits match the posts table columns, so oversized input is a 400, not a DB error.
    @Size(max = 200)
    private String bookAuthor;
    @Size(max = 100)
    private String bookCategory;
    @Size(max = 200)
    private String bookDeal;
    @Size(max = 30)
    private String bookDealType;
    @Size(max = 100)
    private String bookLocation;
    @Size(max = 30)
    private String bookCondition;
    @Size(max = 2000)
    private String bookDescription;
    private Double pickupLat;
    private Double pickupLng;
    @Size(max = 200)
    private String pickupSpot;
    // Boolean wrapper: null means "leave unchanged" on update, "public" on create.
    private Boolean isPublic;
    private MultipartFile image;
}
