package com.ktebna.backend.unit;

import com.ktebna.backend.storage.S3UploadStore;
import com.ktebna.backend.storage.UploadStore.StoredUpload;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.wait.strategy.Wait;
import org.testcontainers.images.builder.Transferable;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.HexFormat;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

// Runs S3UploadStore against the same Garage image and settings as Compose and
// Kubernetes, so a Garage or SDK change that breaks uploads fails here first.
class S3UploadStoreTest {

    // Random per run, in Garage's formats ("GK" + 32 hex, 64 hex): nothing
    // key-like is committed, so secret scanners have nothing to flag.
    private static final String ACCESS_KEY = "GK" + randomHex(16);
    private static final String SECRET_KEY = randomHex(32);
    private static final String CONFIG = """
            metadata_dir = "/var/lib/garage/meta"
            data_dir = "/var/lib/garage/data"
            db_engine = "sqlite"
            replication_factor = 1
            rpc_bind_addr = "[::]:3901"
            rpc_public_addr = "127.0.0.1:3901"
            [s3_api]
            s3_region = "garage"
            api_bind_addr = "[::]:3900"
            """;

    @SuppressWarnings("resource")
    private static final GenericContainer<?> GARAGE = new GenericContainer<>("dxflrs/garage:v2.4.1")
            .withCopyToContainer(Transferable.of(CONFIG), "/etc/garage/garage.toml")
            .withEnv("GARAGE_CONFIG_FILE", "/etc/garage/garage.toml")
            .withEnv("GARAGE_RPC_SECRET", randomHex(32))
            .withEnv("GARAGE_DEFAULT_ACCESS_KEY", ACCESS_KEY)
            .withEnv("GARAGE_DEFAULT_SECRET_KEY", SECRET_KEY)
            .withEnv("GARAGE_DEFAULT_BUCKET", "ktebna-uploads")
            .withCommand("/garage", "server", "--single-node", "--default-bucket")
            .withExposedPorts(3900)
            .waitingFor(Wait.forLogMessage(".*S3 API server listening.*", 1));

    private static S3UploadStore store;

    private static String randomHex(int bytes) {
        byte[] b = new byte[bytes];
        new SecureRandom().nextBytes(b);
        return HexFormat.of().formatHex(b);
    }

    @BeforeAll
    static void start() {
        GARAGE.start();
        store = new S3UploadStore("http://" + GARAGE.getHost() + ":" + GARAGE.getMappedPort(3900),
                "garage", "ktebna-uploads", ACCESS_KEY, SECRET_KEY);
    }

    @AfterAll
    static void stop() {
        store.close();
        GARAGE.stop();
    }

    @Test
    void storesReadsAndDeletesAnImage() throws Exception {
        byte[] bytes = {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, 1, 2, 3};
        String name = "11111111-2222-3333-4444-555555555555.jpg";
        Instant before = Instant.now().minusSeconds(5);

        store.put(name, bytes, "image/jpeg");

        StoredUpload upload = store.get(name).orElseThrow();
        assertThat(upload.bytes()).isEqualTo(bytes);
        assertThat(upload.contentType()).isEqualTo("image/jpeg");
        assertThat(upload.lastModified()).isAfter(before);

        store.delete(name);
        assertThat(store.get(name)).isEmpty();
    }

    @Test
    void missingFilesAreEmptyAndDeletingThemIsFine() throws Exception {
        String name = "99999999-2222-3333-4444-555555555555.png";
        assertThat(store.get(name)).isEqualTo(Optional.empty());
        store.delete(name);
    }

    @Test
    void refusesToStartWithoutCredentials() {
        assertThatThrownBy(() -> new S3UploadStore("http://garage:3900", "garage", "ktebna-uploads", "", ""))
                .isInstanceOf(IllegalStateException.class);
    }
}
