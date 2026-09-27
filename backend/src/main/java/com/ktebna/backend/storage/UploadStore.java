package com.ktebna.backend.storage;

import java.io.IOException;
import java.time.Instant;
import java.util.Optional;

/**
 * Where uploaded images live, by file name ("<uuid>.jpg"). Chosen by
 * app.storage.type: "disk" (a local folder) or "s3" (Garage or any other
 * S3-compatible server), so several backend pods can share one store.
 */
public interface UploadStore {

    void put(String name, byte[] bytes, String contentType) throws IOException;

    Optional<StoredUpload> get(String name) throws IOException;

    // Missing files are not an error: the goal is that the file is gone.
    void delete(String name) throws IOException;

    record StoredUpload(byte[] bytes, String contentType, Instant lastModified) {
    }
}
