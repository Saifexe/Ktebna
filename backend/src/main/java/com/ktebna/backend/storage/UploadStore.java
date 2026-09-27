package com.ktebna.backend.storage;

import java.io.IOException;
import java.time.Instant;
import java.util.Arrays;
import java.util.Objects;
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

        // A record's own equals/hashCode compare arrays by reference: compare the bytes.
        @Override
        public boolean equals(Object o) {
            return o instanceof StoredUpload other
                    && Arrays.equals(bytes, other.bytes)
                    && Objects.equals(contentType, other.contentType)
                    && Objects.equals(lastModified, other.lastModified);
        }

        @Override
        public int hashCode() {
            return 31 * Objects.hash(contentType, lastModified) + Arrays.hashCode(bytes);
        }

        // The size, not the image bytes, so a log line stays short.
        @Override
        public String toString() {
            return "StoredUpload[" + bytes.length + " bytes, " + contentType + ", " + lastModified + "]";
        }
    }
}
