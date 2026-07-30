package com.ktebna.backend.service;

import com.ktebna.backend.exception.ApiException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class FileStorageService {

    @Value("${app.upload.dir}")
    private String uploadDir;

    @Value("${app.base-url}")
    private String baseUrl;

    public String store(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ApiException("File is empty", HttpStatus.BAD_REQUEST);
        }
        try {
            Path dir = Paths.get(uploadDir);
            Files.createDirectories(dir);

            String original = file.getOriginalFilename() != null ? file.getOriginalFilename() : "file";
            String ext = original.contains(".") ? original.substring(original.lastIndexOf('.')) : "";
            String fileName = UUID.randomUUID() + ext;

            Path target = dir.resolve(fileName);
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

            return baseUrl + "/uploads/" + fileName;
        } catch (IOException e) {
            throw new ApiException("Failed to store file: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
