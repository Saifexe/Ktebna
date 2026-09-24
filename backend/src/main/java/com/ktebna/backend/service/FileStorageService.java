package com.ktebna.backend.service;

import com.ktebna.backend.exception.ApiException;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.IIOImage;
import javax.imageio.ImageIO;
import javax.imageio.ImageReadParam;
import javax.imageio.ImageReader;
import javax.imageio.ImageWriteParam;
import javax.imageio.ImageWriter;
import javax.imageio.stream.ImageInputStream;
import javax.imageio.stream.ImageOutputStream;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.geom.AffineTransform;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Iterator;
import java.util.UUID;
import java.util.regex.Pattern;

@Service
public class FileStorageService {

    // Longest side of a stored image: sharp on a book page, a fraction of a
    // phone photo's size for every catalog visitor.
    static final int MAX_DIMENSION = 1600;
    // Refuse images whose pixels alone would take hundreds of MB to decode
    // (a small, highly compressed file can declare a huge canvas).
    static final long MAX_SOURCE_PIXELS = 64_000_000L;
    private static final float JPEG_QUALITY = 0.85f;
    // What store() returns: a random UUID plus our own extension. Also rules out
    // "../" and any path outside the uploads directory.
    private static final Pattern STORED_NAME =
            Pattern.compile("/uploads/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\\.(jpg|jpeg|png|gif|webp)");
    private static final Logger log = LoggerFactory.getLogger(FileStorageService.class);

    @Value("${app.upload.dir}")
    private String uploadDir;

    // ImageIO finds decoders through the class loader that first touches it;
    // inside the Spring Boot jar that can miss the WebP/JPEG plugins without a rescan.
    @PostConstruct
    void registerImagePlugins() {
        ImageIO.scanForPlugins();
    }

    /**
     * Stores an uploaded cover or avatar as a newly encoded image. Only the
     * pixels are kept: EXIF data (a phone photo's GPS position, camera, date)
     * and any other embedded content are dropped, the photo is turned upright
     * and shrunk to MAX_DIMENSION. Opaque images become JPEG, transparent ones PNG.
     */
    public String store(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ApiException("File is empty", HttpStatus.BAD_REQUEST);
        }
        try {
            // Trust the bytes, not the client's file name or Content-Type.
            byte[] bytes = file.getBytes();
            String format = detectImageFormat(bytes);
            if (format == null) {
                throw new ApiException("Only JPEG, PNG, GIF or WebP images are allowed", HttpStatus.BAD_REQUEST);
            }

            BufferedImage image = decode(bytes);
            int orientation = "jpeg".equals(format) ? exifOrientation(bytes) : 1;
            image = shrink(orient(image, orientation));

            boolean transparent = hasTransparentPixel(image);
            if (!transparent && image.getType() != BufferedImage.TYPE_INT_RGB) {
                // An alpha channel that is fully opaque (common in phone PNGs): store as JPEG.
                image = redraw(image, image.getWidth(), image.getHeight(), BufferedImage.TYPE_INT_RGB);
            }
            String fileName = UUID.randomUUID() + (transparent ? ".png" : ".jpg");
            Path dir = Paths.get(uploadDir);
            Files.createDirectories(dir);
            write(image, transparent, dir.resolve(fileName));

            // Relative, so links survive a change of host or domain: nginx (or the
            // frontend's API base URL in dev) serves /uploads from the backend.
            return "/uploads/" + fileName;
        } catch (IOException e) {
            throw new ApiException("Failed to store file", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Deletes a stored upload once the current transaction commits (at once when
     * there is none), so a rolled-back change never loses the image its row
     * still points at. Anything that isn't one of our upload names is ignored.
     */
    public void deleteLater(String url) {
        if (url == null || !STORED_NAME.matcher(url).matches()) {
            return;
        }
        Path file = Paths.get(uploadDir).resolve(url.substring("/uploads/".length()));
        Runnable delete = () -> {
            try {
                Files.deleteIfExists(file);
            } catch (IOException e) {
                log.warn("Could not delete upload {}: {}", file, e.getMessage());
            }
        };
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    delete.run();
                }
            });
        } else {
            delete.run();
        }
    }

    // Magic-number check on the first bytes of the upload.
    static String detectImageFormat(byte[] h) {
        int n = h.length;
        if (n >= 3 && (h[0] & 0xFF) == 0xFF && (h[1] & 0xFF) == 0xD8 && (h[2] & 0xFF) == 0xFF) {
            return "jpeg";
        }
        if (n >= 8 && (h[0] & 0xFF) == 0x89 && h[1] == 'P' && h[2] == 'N' && h[3] == 'G'
                && h[4] == 0x0D && h[5] == 0x0A && h[6] == 0x1A && h[7] == 0x0A) {
            return "png";
        }
        if (n >= 6 && h[0] == 'G' && h[1] == 'I' && h[2] == 'F' && h[3] == '8' && (h[4] == '7' || h[4] == '9') && h[5] == 'a') {
            return "gif";
        }
        if (n >= 12 && h[0] == 'R' && h[1] == 'I' && h[2] == 'F' && h[3] == 'F'
                && h[8] == 'W' && h[9] == 'E' && h[10] == 'B' && h[11] == 'P') {
            return "webp";
        }
        return null;
    }

    // Decodes the first frame. Very large images are subsampled while decoding,
    // so a 50-megapixel photo never has to sit in memory at full size.
    private static BufferedImage decode(byte[] bytes) {
        try (ImageInputStream in = ImageIO.createImageInputStream(new ByteArrayInputStream(bytes))) {
            Iterator<ImageReader> readers = ImageIO.getImageReaders(in);
            if (!readers.hasNext()) {
                throw unreadable();
            }
            ImageReader reader = readers.next();
            try {
                reader.setInput(in, true, true);
                int width = reader.getWidth(0);
                int height = reader.getHeight(0);
                if ((long) width * height > MAX_SOURCE_PIXELS) {
                    throw new ApiException("The image has too many pixels; please use a smaller photo", HttpStatus.BAD_REQUEST);
                }
                ImageReadParam param = reader.getDefaultReadParam();
                int step = Math.max(1, Math.max(width, height) / (MAX_DIMENSION * 2));
                param.setSourceSubsampling(step, step, 0, 0);
                BufferedImage image = reader.read(0, param);
                if (image == null) {
                    throw unreadable();
                }
                return image;
            } finally {
                reader.dispose();
            }
        } catch (IOException | RuntimeException e) {
            if (e instanceof ApiException api) {
                throw api;
            }
            // Right magic number, broken or truncated content.
            throw unreadable();
        }
    }

    private static ApiException unreadable() {
        return new ApiException("The image could not be read; please try another file", HttpStatus.BAD_REQUEST);
    }

    // The EXIF Orientation tag (1-8) of a JPEG, or 1 when there is none.
    // Phones store photos sideways and let this tag rotate them on display, so
    // it has to be applied to the pixels before the EXIF block is thrown away.
    public static int exifOrientation(byte[] jpeg) {
        int i = 2;
        while (i + 4 <= jpeg.length && (jpeg[i] & 0xFF) == 0xFF) {
            int marker = jpeg[i + 1] & 0xFF;
            if (marker == 0xFF) { // fill byte
                i++;
                continue;
            }
            if (marker == 0xDA || marker == 0xD9) { // image data starts / ends
                break;
            }
            int length = ((jpeg[i + 2] & 0xFF) << 8) | (jpeg[i + 3] & 0xFF);
            int start = i + 4;
            int end = i + 2 + length;
            if (length < 2 || end > jpeg.length) {
                break;
            }
            if (marker == 0xE1 && end - start > 6 && jpeg[start] == 'E' && jpeg[start + 1] == 'x'
                    && jpeg[start + 2] == 'i' && jpeg[start + 3] == 'f' && jpeg[start + 4] == 0 && jpeg[start + 5] == 0) {
                return orientationFromTiff(jpeg, start + 6, end);
            }
            i = end;
        }
        return 1;
    }

    // EXIF is a small TIFF structure: byte order, then IFD0's entries of 12 bytes.
    private static int orientationFromTiff(byte[] b, int tiff, int end) {
        if (tiff + 8 > end) {
            return 1;
        }
        boolean littleEndian = b[tiff] == 'I' && b[tiff + 1] == 'I';
        if (!littleEndian && !(b[tiff] == 'M' && b[tiff + 1] == 'M')) {
            return 1;
        }
        long ifdOffset = u32(b, tiff + 4, littleEndian);
        if (ifdOffset < 8 || tiff + ifdOffset + 2 > end) {
            return 1;
        }
        int ifd = tiff + (int) ifdOffset;
        int entries = u16(b, ifd, littleEndian);
        for (int k = 0; k < entries; k++) {
            int entry = ifd + 2 + k * 12;
            if (entry + 12 > end) {
                break;
            }
            if (u16(b, entry, littleEndian) == 0x0112) {
                int value = u16(b, entry + 8, littleEndian);
                return value >= 1 && value <= 8 ? value : 1;
            }
        }
        return 1;
    }

    private static int u16(byte[] b, int at, boolean littleEndian) {
        int b0 = b[at] & 0xFF;
        int b1 = b[at + 1] & 0xFF;
        return littleEndian ? (b1 << 8) | b0 : (b0 << 8) | b1;
    }

    private static long u32(byte[] b, int at, boolean littleEndian) {
        long hi = u16(b, littleEndian ? at + 2 : at, littleEndian);
        long lo = u16(b, littleEndian ? at : at + 2, littleEndian);
        return (hi << 16) | lo;
    }

    // Applies an EXIF orientation to the pixels. 5-8 swap width and height.
    static BufferedImage orient(BufferedImage src, int orientation) {
        int w = src.getWidth();
        int h = src.getHeight();
        // AffineTransform(m00, m10, m01, m11, m02, m12): x' = m00*x + m01*y + m02, y' = m10*x + m11*y + m12
        AffineTransform t = switch (orientation) {
            case 2 -> new AffineTransform(-1, 0, 0, 1, w, 0);   // mirrored
            case 3 -> new AffineTransform(-1, 0, 0, -1, w, h);  // upside down
            case 4 -> new AffineTransform(1, 0, 0, -1, 0, h);   // mirrored vertically
            case 5 -> new AffineTransform(0, 1, 1, 0, 0, 0);    // transposed
            case 6 -> new AffineTransform(0, 1, -1, 0, h, 0);   // turned 90° clockwise
            case 7 -> new AffineTransform(0, -1, -1, 0, h, w);  // transversed
            case 8 -> new AffineTransform(0, -1, 1, 0, 0, w);   // turned 90° counter-clockwise
            default -> null;
        };
        if (t == null) {
            return src;
        }
        boolean swap = orientation >= 5;
        BufferedImage out = new BufferedImage(swap ? h : w, swap ? w : h, targetType(src));
        Graphics2D g = out.createGraphics();
        try {
            g.drawImage(src, t, null);
        } finally {
            g.dispose();
        }
        return out;
    }

    // Scales down to MAX_DIMENSION, halving at most per step (a single big jump
    // with bilinear filtering looks jagged). Always returns a plain RGB or ARGB
    // image, which is what the encoders expect (GIFs, for one, are indexed).
    static BufferedImage shrink(BufferedImage src) {
        int w = src.getWidth();
        int h = src.getHeight();
        double scale = Math.min(1.0, (double) MAX_DIMENSION / Math.max(w, h));
        int targetW = Math.max(1, (int) Math.round(w * scale));
        int targetH = Math.max(1, (int) Math.round(h * scale));
        int type = targetType(src);

        BufferedImage current = src;
        do {
            w = Math.max(targetW, w / 2);
            h = Math.max(targetH, h / 2);
            if (scale == 1.0) {
                w = targetW;
                h = targetH;
            }
            current = redraw(current, w, h, type);
        } while (w != targetW || h != targetH);
        return current;
    }

    private static BufferedImage redraw(BufferedImage src, int w, int h, int type) {
        BufferedImage out = new BufferedImage(w, h, type);
        Graphics2D g = out.createGraphics();
        try {
            g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
            g.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
            g.drawImage(src, 0, 0, w, h, null);
        } finally {
            g.dispose();
        }
        return out;
    }

    static boolean hasTransparentPixel(BufferedImage image) {
        if (!image.getColorModel().hasAlpha()) {
            return false;
        }
        for (int y = 0; y < image.getHeight(); y++) {
            for (int x = 0; x < image.getWidth(); x++) {
                if ((image.getRGB(x, y) >>> 24) != 0xFF) {
                    return true;
                }
            }
        }
        return false;
    }

    private static int targetType(BufferedImage src) {
        return src.getColorModel().hasAlpha() ? BufferedImage.TYPE_INT_ARGB : BufferedImage.TYPE_INT_RGB;
    }

    private static void write(BufferedImage image, boolean png, Path target) throws IOException {
        if (png) {
            if (!ImageIO.write(image, "png", target.toFile())) {
                throw new IOException("No PNG writer");
            }
            return;
        }
        ImageWriter writer = ImageIO.getImageWritersByFormatName("jpeg").next();
        try (ImageOutputStream out = ImageIO.createImageOutputStream(target.toFile())) {
            writer.setOutput(out);
            ImageWriteParam param = writer.getDefaultWriteParam();
            param.setCompressionMode(ImageWriteParam.MODE_EXPLICIT);
            param.setCompressionQuality(JPEG_QUALITY);
            writer.write(null, new IIOImage(image, null, null), param);
        } finally {
            writer.dispose();
        }
    }
}
