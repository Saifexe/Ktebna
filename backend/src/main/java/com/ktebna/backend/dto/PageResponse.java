package com.ktebna.backend.dto;

import org.springframework.data.domain.Page;

import java.util.List;

// One page of a paginated list, as the frontend reads it: {data, count, totalPages}.
public record PageResponse<T>(List<T> data, long count, int totalPages) {

    public static <T> PageResponse<T> of(Page<T> page) {
        return new PageResponse<>(page.getContent(), page.getTotalElements(), page.getTotalPages());
    }
}
