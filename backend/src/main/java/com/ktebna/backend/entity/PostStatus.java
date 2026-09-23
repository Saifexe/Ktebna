package com.ktebna.backend.entity;

// Where a listing's deal stands. SOLD covers every finished deal (a sale, a swap
// or a gift); the frontend words it by deal type ("Sold", "Swapped", "Given away").
public enum PostStatus {
    AVAILABLE,
    RESERVED,
    SOLD
}
