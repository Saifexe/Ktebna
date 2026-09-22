package com.ktebna.backend.controller;

import org.springframework.data.domain.PageRequest;

// Page and size come straight from the query string: clamp them so a negative
// page can't error and ?size=1000000 can't load a whole table in one request.
final class Paging {

    static final int MAX_SIZE = 50;

    private Paging() {
    }

    static PageRequest of(int page, int size) {
        return PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), MAX_SIZE));
    }
}
