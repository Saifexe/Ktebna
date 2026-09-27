package com.ktebna.backend.storage;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.MediaType;
import org.springframework.http.MediaTypeFactory;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.NoSuchFileException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Optional;

// Uploads in a local folder (app.upload.dir): the default, for local
// development and tests. Only works with a single backend instance.
@Component
@ConditionalOnProperty(name = "app.storage.type", havingValue = "disk", matchIfMissing = true)
public class DiskUploadStore implements UploadStore {

    private final Path dir;

    public DiskUploadStore(@Value("${app.upload.dir}") String dir) {
        this.dir = Paths.get(dir);
    }

    @Override
    public void put(String name, byte[] bytes, String contentType) throws IOException {
        Files.createDirectories(dir);
        Files.write(dir.resolve(name), bytes);
    }

    @Override
    public Optional<StoredUpload> get(String name) throws IOException {
        Path file = dir.resolve(name);
        try {
            byte[] bytes = Files.readAllBytes(file);
            String type = MediaTypeFactory.getMediaType(name).orElse(MediaType.APPLICATION_OCTET_STREAM).toString();
            return Optional.of(new StoredUpload(bytes, type, Files.getLastModifiedTime(file).toInstant()));
        } catch (NoSuchFileException e) {
            return Optional.empty();
        }
    }

    @Override
    public void delete(String name) throws IOException {
        Files.deleteIfExists(dir.resolve(name));
    }
}
