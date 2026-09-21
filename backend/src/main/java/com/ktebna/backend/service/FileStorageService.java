package com.ktebna.backend.service;

import com.ktebna.backend.exception.ApiException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
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
            // Trust the bytes, not the client's file name or Content-Type: only real
            // images are stored, and the extension comes from the detected format.
            String ext = detectImageExtension(file);
            if (ext == null) {
                throw new ApiException("Only JPEG, PNG, GIF or WebP images are allowed", HttpStatus.BAD_REQUEST);
            }

            Path dir = Paths.get(uploadDir);
            Files.createDirectories(dir);
            String fileName = UUID.randomUUID() + ext;
            Files.copy(file.getInputStream(), dir.resolve(fileName), StandardCopyOption.REPLACE_EXISTING);

            return baseUrl + "/uploads/" + fileName;
        } catch (IOException e) {
            throw new ApiException("Failed to store file", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Magic-number check on the first bytes of the upload.
    private static String detectImageExtension(MultipartFile file) throws IOException {
        byte[] h = new byte[12];
        int n;
        try (InputStream in = file.getInputStream()) {
            n = in.readNBytes(h, 0, h.length);
        }
        if (n >= 3 && (h[0] & 0xFF) == 0xFF && (h[1] & 0xFF) == 0xD8 && (h[2] & 0xFF) == 0xFF) {
            return ".jpg";
        }
        if (n >= 8 && (h[0] & 0xFF) == 0x89 && h[1] == 'P' && h[2] == 'N' && h[3] == 'G'
                && h[4] == 0x0D && h[5] == 0x0A && h[6] == 0x1A && h[7] == 0x0A) {
            return ".png";
        }
        if (n >= 6 && h[0] == 'G' && h[1] == 'I' && h[2] == 'F' && h[3] == '8' && (h[4] == '7' || h[4] == '9') && h[5] == 'a') {
            return ".gif";
        }
        if (n >= 12 && h[0] == 'R' && h[1] == 'I' && h[2] == 'F' && h[3] == 'F'
                && h[8] == 'W' && h[9] == 'E' && h[10] == 'B' && h[11] == 'P') {
            return ".webp";
        }
        return null;
    }
}
