package com.ktebna.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
public class PostResponse {
    private Long id;
    private String bookName;
    private String bookCategory;
    private String bookDeal;
    private String bookDealType;
    private String bookImage;
    private String bookLocation;
    private boolean isPublic;
    private LocalDateTime createdAt;
    private UserDto user;
}
