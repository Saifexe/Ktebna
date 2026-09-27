package com.ktebna.backend.dto;

import com.ktebna.backend.entity.User;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class UserDto {
    private Long id;
    private String name;
    private String email;
    private String profilePicture;

    // How other readers see a user: name and avatar, never the email address.
    public static UserDto withoutEmail(User user) {
        return new UserDto(user.getId(), user.getName(), null, user.getProfilePicture());
    }
}
