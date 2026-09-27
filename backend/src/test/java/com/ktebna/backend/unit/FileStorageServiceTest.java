package com.ktebna.backend.unit;

import com.ktebna.backend.TestImages;
import com.ktebna.backend.exception.ApiException;
import com.ktebna.backend.service.FileStorageService;
import com.ktebna.backend.storage.DiskUploadStore;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockMultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Arrays;
import java.util.stream.Stream;
import java.util.zip.CRC32;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class FileStorageServiceTest {

    @TempDir
    Path uploadDir;

    private FileStorageService storage;

    @BeforeEach
    void setUp() {
        storage = new FileStorageService(new DiskUploadStore(uploadDir.toString()));
    }

    private Path storeAs(String clientName, String contentType, byte[] content) {
        String url = storage.store(new MockMultipartFile("image", clientName, contentType, content));
        assertThat(url).startsWith("/uploads/");
        return uploadDir.resolve(url.substring("/uploads/".length()));
    }

    private static BufferedImage read(Path file) throws Exception {
        BufferedImage image = ImageIO.read(file.toFile());
        assertThat(image).as("stored file decodes").isNotNull();
        return image;
    }

    static Stream<Arguments> acceptedFormats() {
        return Stream.of(
                Arguments.of("jpeg", TestImages.jpeg(40, 30), ".jpg"),
                Arguments.of("opaque png", TestImages.png(40, 30, false), ".jpg"),
                Arguments.of("transparent png", TestImages.png(40, 30, true), ".png"),
                Arguments.of("gif", TestImages.gif(40, 30), ".jpg"),
                Arguments.of("webp", TestImages.WEBP_6x4, ".jpg")
        );
    }

    @ParameterizedTest(name = "{0} is re-encoded and stored as {2}")
    @MethodSource("acceptedFormats")
    void storesEveryAcceptedFormatAsANewlyEncodedImage(String type, byte[] content, String ext) throws Exception {
        // The client claims a misleading name; the stored name is random, the type comes from the pixels.
        Path stored = storeAs("holiday.exe", "application/octet-stream", content);

        assertThat(stored.getFileName().toString()).endsWith(ext).doesNotContain("holiday");
        read(stored);
    }

    @Test
    void dropsExifSoAPhotosGpsPositionIsNeverPublished() throws Exception {
        byte[] phonePhoto = TestImages.withExif(TestImages.jpeg(40, 30), 1);
        assertThat(indexOf(phonePhoto, "Exif")).as("fixture carries EXIF").isNotNegative();

        byte[] stored = Files.readAllBytes(storeAs("IMG_0001.jpg", "image/jpeg", phonePhoto));

        assertThat(indexOf(stored, "Exif")).isNegative();
    }

    @Test
    void turnsSidewaysPhonePhotosUpright() throws Exception {
        // Stored 40 wide x 30 high, tagged "rotate 90° clockwise to display": upright it is 30 x 40.
        byte[] sideways = TestImages.withExif(TestImages.jpeg(40, 30), 6);

        BufferedImage upright = read(storeAs("portrait.jpg", "image/jpeg", sideways));

        assertThat(upright.getWidth()).isEqualTo(30);
        assertThat(upright.getHeight()).isEqualTo(40);
    }

    // Where the stored photo's top-left (red) corner must appear once displayed upright,
    // for each EXIF orientation: https://www.exif.org/Exif2-2.PDF (tag 0x0112).
    static Stream<Arguments> orientations() {
        return Stream.of(
                Arguments.of(1, false, "top-left"), Arguments.of(2, false, "top-right"),
                Arguments.of(3, false, "bottom-right"), Arguments.of(4, false, "bottom-left"),
                Arguments.of(5, true, "top-left"), Arguments.of(6, true, "top-right"),
                Arguments.of(7, true, "bottom-right"), Arguments.of(8, true, "bottom-left"));
    }

    @ParameterizedTest(name = "orientation {0} puts the stored top-left corner at the {2}")
    @MethodSource("orientations")
    void appliesEveryExifOrientationToThePixels(int orientation, boolean turned, String corner) throws Exception {
        for (boolean littleEndian : new boolean[]{false, true}) {
            byte[] photo = TestImages.withExif(TestImages.jpegWithRedTopLeft(40, 20), orientation, littleEndian);

            BufferedImage upright = read(storeAs("photo.jpg", "image/jpeg", photo));

            assertThat(upright.getWidth()).isEqualTo(turned ? 20 : 40);
            assertThat(upright.getHeight()).isEqualTo(turned ? 40 : 20);
            int w = upright.getWidth();
            int h = upright.getHeight();
            int x = corner.endsWith("left") ? w / 4 : w * 3 / 4;
            int y = corner.startsWith("top") ? h / 4 : h * 3 / 4;
            int rgb = upright.getRGB(x, y);
            assertThat((rgb >> 16) & 0xFF).as("red at the %s (%s byte order)", corner, littleEndian ? "II" : "MM")
                    .isGreaterThan(200);
            assertThat(rgb & 0xFF).isLessThan(60);
        }
    }

    @Test
    void shrinksLargePhotosToTheMaximumSideKeepingTheirShape() throws Exception {
        BufferedImage stored = read(storeAs("big.jpg", "image/jpeg", TestImages.jpeg(4000, 3000)));

        assertThat(stored.getWidth()).isEqualTo(1600);
        assertThat(stored.getHeight()).isEqualTo(1200);
    }

    @Test
    void keepsSmallImagesAtTheirSize() throws Exception {
        BufferedImage stored = read(storeAs("small.png", "image/png", TestImages.png(300, 200, true)));

        assertThat(stored.getWidth()).isEqualTo(300);
        assertThat(stored.getHeight()).isEqualTo(200);
    }

    @Test
    void readsTheExifOrientationTag() {
        assertThat(FileStorageService.exifOrientation(TestImages.withExif(TestImages.jpeg(8, 8), 8))).isEqualTo(8);
        assertThat(FileStorageService.exifOrientation(TestImages.jpeg(8, 8))).isEqualTo(1);
        // A truncated EXIF block is ignored, never an error.
        byte[] tagged = TestImages.withExif(TestImages.jpeg(8, 8), 6);
        assertThat(FileStorageService.exifOrientation(Arrays.copyOf(tagged, 30))).isEqualTo(1);
    }

    @Test
    void refusesAFewBytesThatDeclareAHugeCanvasBeforeDecodingThem() {
        // A PNG header claiming 20000 x 20000 pixels (1.6 GB once decoded) and no pixel data.
        ByteBuffer ihdr = ByteBuffer.allocate(17).put("IHDR".getBytes(StandardCharsets.US_ASCII))
                .putInt(20_000).putInt(20_000).put((byte) 8).put((byte) 6).put((byte) 0).put((byte) 0).put((byte) 0);
        CRC32 crc = new CRC32();
        crc.update(ihdr.array());
        byte[] bomb = ByteBuffer.allocate(8 + 4 + 17 + 4)
                .put(new byte[]{(byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A})
                .putInt(13).put(ihdr.array()).putInt((int) crc.getValue()).array();

        assertThatThrownBy(() -> storeAs("bomb.png", "image/png", bomb))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("too many pixels");
    }

    @Test
    void rejectsAJpegHeaderWithNoImageBehindIt() {
        byte[] headerOnly = {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0, 0, 0x10, 'J', 'F', 'I', 'F', 0, 1};

        assertThatThrownBy(() -> storeAs("cover.jpg", "image/jpeg", headerOnly))
                .isInstanceOf(ApiException.class)
                .satisfies(e -> assertThat(((ApiException) e).getStatus()).isEqualTo(HttpStatus.BAD_REQUEST));
        assertThat(uploadDir.toFile().list()).isEmpty();
    }

    @Test
    void rejectsNonImageContentDisguisedAsJpeg() {
        byte[] php = "<?php system($_GET['c']); ?>".getBytes(StandardCharsets.UTF_8);

        assertThatThrownBy(() -> storage.store(new MockMultipartFile("image", "cover.jpg", "image/jpeg", php)))
                .isInstanceOf(ApiException.class)
                .satisfies(e -> assertThat(((ApiException) e).getStatus()).isEqualTo(HttpStatus.BAD_REQUEST));
        assertThat(uploadDir.toFile().list()).isEmpty();
    }

    static Stream<Arguments> lookAlikes() {
        return Stream.of(
                Arguments.of("RIFF audio, not WebP", new byte[]{'R', 'I', 'F', 'F', 0, 0, 0, 0, 'W', 'A', 'V', 'E'}),
                Arguments.of("RIF without the second F", new byte[]{'R', 'I', 'F', 'X', 0, 0, 0, 0, 'W', 'E', 'B', 'P'}),
                Arguments.of("GIF with an unknown version", new byte[]{'G', 'I', 'F', '8', '8', 'a', 0, 0}),
                Arguments.of("GIF89 without the a", new byte[]{'G', 'I', 'F', '8', '9', 'b', 0, 0}),
                Arguments.of("PNG with a broken line ending", new byte[]{(byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x00}),
                Arguments.of("PNG spelled wrong", new byte[]{(byte) 0x89, 'P', 'N', 'X', 0x0D, 0x0A, 0x1A, 0x0A}),
                Arguments.of("JPEG start without a marker", new byte[]{(byte) 0xFF, (byte) 0xD8, 0x00, 0x00}),
                Arguments.of("a lone 0xFF", new byte[]{(byte) 0xFF, 0x00, 0x00, 0x00}));
    }

    @ParameterizedTest(name = "rejects {0}")
    @MethodSource("lookAlikes")
    void rejectsHeadersThatOnlyLookLikeAnImage(String what, byte[] header) {
        byte[] content = Arrays.copyOf(header, 64);

        assertThatThrownBy(() -> storeAs("cover.jpg", "image/jpeg", content))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("Only JPEG, PNG, GIF or WebP");
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

    private static int indexOf(byte[] haystack, String needle) {
        byte[] n = needle.getBytes(StandardCharsets.US_ASCII);
        outer:
        for (int i = 0; i <= haystack.length - n.length; i++) {
            for (int j = 0; j < n.length; j++) {
                if (haystack[i + j] != n[j]) {
                    continue outer;
                }
            }
            return i;
        }
        return -1;
    }
}
