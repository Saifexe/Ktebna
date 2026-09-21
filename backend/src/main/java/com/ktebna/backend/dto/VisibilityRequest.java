package com.ktebna.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class VisibilityRequest {
    // Without this, Lombok's isPublic()/setPublic() make Jackson expect "public",
    // so the {"isPublic": ...} body the frontend sends was silently ignored.
    @JsonProperty("isPublic")
    private boolean isPublic;
}
