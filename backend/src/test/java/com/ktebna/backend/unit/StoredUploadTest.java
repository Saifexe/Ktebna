package com.ktebna.backend.unit;

import com.ktebna.backend.storage.UploadStore.StoredUpload;
import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;

class StoredUploadTest {

    private static final Instant WHEN = Instant.parse("2026-09-27T10:00:00Z");

    @Test
    void equalImagesAreEqualEvenInDifferentArrays() {
        StoredUpload a = new StoredUpload(new byte[]{1, 2, 3}, "image/jpeg", WHEN);
        StoredUpload b = new StoredUpload(new byte[]{1, 2, 3}, "image/jpeg", WHEN);

        assertThat(a).isEqualTo(b).hasSameHashCodeAs(b);
        assertThat(a).isNotEqualTo(new StoredUpload(new byte[]{1, 2, 4}, "image/jpeg", WHEN));
        assertThat(a).isNotEqualTo(new StoredUpload(new byte[]{1, 2, 3}, "image/png", WHEN));
    }

    @Test
    void toStringShowsTheSizeNotTheBytes() {
        assertThat(new StoredUpload(new byte[2048], "image/png", WHEN))
                .hasToString("StoredUpload[2048 bytes, image/png, 2026-09-27T10:00:00Z]");
    }
}
