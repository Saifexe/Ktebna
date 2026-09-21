package com.ktebna.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.ktebna.backend.entity.Post;
import com.ktebna.backend.entity.User;
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
    private String bookAuthor;
    private String bookCategory;
    private String bookDeal;
    private String bookDealType;
    private String bookImage;
    private String bookLocation;
    private String bookCondition;
    private String bookDescription;
    private Double pickupLat;
    private Double pickupLng;
    private String pickupSpot;
    // Without this, Lombok's isPublic() getter makes Jackson emit "public".
    @JsonProperty("isPublic")
    private boolean isPublic;
    private LocalDateTime createdAt;
    private UserDto user;

    public static PostResponse from(Post post) {
        User u = post.getUser();
        UserDto userDto = new UserDto(u.getId(), u.getName(), u.getEmail(), u.getProfilePicture());
        return new PostResponse(
                post.getId(), post.getBookName(), post.getBookAuthor(), post.getBookCategory(),
                post.getBookDeal(), post.getBookDealType(), post.getBookImage(), post.getBookLocation(),
                post.getBookCondition(), post.getBookDescription(),
                post.getPickupLat(), post.getPickupLng(), post.getPickupSpot(),
                post.isPublic(), post.getCreatedAt(), userDto
        );
    }
}
