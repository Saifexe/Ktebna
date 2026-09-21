package com.ktebna.backend.unit;

import com.ktebna.backend.exception.ApiException;
import com.ktebna.backend.service.FileStorageService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class FileStorageServiceTest {

    @TempDir
    Path uploadDir;

    private FileStorageService storage;

    @BeforeEach
    void setUp() {
        storage = new FileStorageService();
        ReflectionTestUtils.setField(storage, "uploadDir", uploadDir.toString());
        ReflectionTestUtils.setField(storage, "baseUrl", "http://localhost:8080");
    }

    static byte[] withHeader(int... header) {
        byte[] bytes = new byte[64];
        for (int i = 0; i < header.length; i++) {
            bytes[i] = (byte) header[i];
        }
        return bytes;
    }

    static Stream<Arguments> realImages() {
        return Stream.of(
                Arguments.of("jpeg", withHeader(0xFF, 0xD8, 0xFF, 0xE0), ".jpg"),
                Arguments.of("png", withHeader(0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A), ".png"),
                Arguments.of("gif89a", withHeader('G', 'I', 'F', '8', '9', 'a'), ".gif"),
                Arguments.of("webp", withHeader('R', 'I', 'F', 'F', 0, 0, 0, 0, 'W', 'E', 'B', 'P'), ".webp")
        );
    }

    @ParameterizedTest(name = "{0} is stored with extension {2}")
    @MethodSource("realImages")
    void storesRealImagesUnderARandomNameWithTheDetectedExtension(String type, byte[] content, String ext) throws Exception {
        // The client claims a misleading name; the stored extension must come from the bytes.
        String url = storage.store(new MockMultipartFile("image", "holiday.exe", "application/octet-stream", content));

        assertThat(url).startsWith("http://localhost:8080/uploads/").endsWith(ext);
        String fileName = url.substring(url.lastIndexOf('/') + 1);
        assertThat(fileName).doesNotContain("holiday");
        assertThat(Files.readAllBytes(uploadDir.resolve(fileName))).isEqualTo(content);
    }

    @Test
    void rejectsNonImageContentDisguisedAsJpeg() {
        byte[] php = "<?php system($_GET['c']); ?>".getBytes(StandardCharsets.UTF_8);

        assertThatThrownBy(() -> storage.store(new MockMultipartFile("image", "cover.jpg", "image/jpeg", php)))
                .isInstanceOf(ApiException.class)
                .satisfies(e -> assertThat(((ApiException) e).getStatus()).isEqualTo(HttpStatus.BAD_REQUEST));
        assertThat(uploadDir.toFile().list()).isEmpty();
    }

    @Test
    void rejectsSvgBecauseItCanCarryScript() {
        byte[] svg = "<svg xmlns=\"http://www.w3.org/2000/svg\"><script>alert(1)</script></svg>".getBytes(StandardCharsets.UTF_8);

        assertThatThrownBy(() -> storage.store(new MockMultipartFile("image", "cover.svg", "image/svg+xml", svg)))
                .isInstanceOf(ApiException.class);
    }

    @Test
    void rejectsEmptyFiles() {
        assertThatThrownBy(() -> storage.store(new MockMultipartFile("image", "empty.jpg", "image/jpeg", new byte[0])))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("empty");
    }

    @Test
    void rejectsTruncatedHeaders() {
        assertThatThrownBy(() -> storage.store(new MockMultipartFile("image", "x.jpg", "image/jpeg", new byte[]{(byte) 0xFF, (byte) 0xD8})))
                .isInstanceOf(ApiException.class);
    }
}
