package com.ktebna.backend.controller;

import com.ktebna.backend.service.FileStorageService;
import com.ktebna.backend.storage.UploadStore.StoredUpload;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.context.request.WebRequest;

// Serves uploaded covers and avatars from whichever store holds them (disk or
// Garage), so the database's relative /uploads/... paths work unchanged.
@RestController
@RequiredArgsConstructor
public class UploadController {

    private final FileStorageService fileStorageService;

    @GetMapping("/uploads/{fileName}")
    public ResponseEntity<byte[]> get(@PathVariable String fileName, WebRequest request) {
        StoredUpload upload = fileStorageService.load(fileName).orElse(null);
        if (upload == null) {
            return ResponseEntity.notFound().build();
        }
        // nginx lets browsers re-check a cached image after a week; answer that
        // with a cheap 304 instead of the whole image.
        long lastModified = upload.lastModified() == null ? -1 : upload.lastModified().toEpochMilli();
        if (lastModified >= 0 && request.checkNotModified(lastModified)) {
            return null;
        }
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(upload.contentType()))
                .lastModified(lastModified)
                .body(upload.bytes());
    }
}
