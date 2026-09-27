package com.ktebna.backend.storage;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.ResponseBytes;
import software.amazon.awssdk.core.checksums.RequestChecksumCalculation;
import software.amazon.awssdk.core.checksums.ResponseChecksumValidation;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.http.urlconnection.UrlConnectionHttpClient;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;
import software.amazon.awssdk.services.s3.model.NoSuchKeyException;

import java.net.URI;
import java.util.Optional;

// Uploads in an S3-compatible bucket (Garage in Compose and Kubernetes), so
// every backend pod sees the same files. The bucket stays private: browsers
// get images through the backend's /uploads/ endpoint, never from the bucket.
@Component
@ConditionalOnProperty(name = "app.storage.type", havingValue = "s3")
public class S3UploadStore implements UploadStore, AutoCloseable {

    private final S3Client s3;
    private final String bucket;

    public S3UploadStore(@Value("${app.s3.endpoint}") String endpoint,
                         @Value("${app.s3.region}") String region,
                         @Value("${app.s3.bucket}") String bucket,
                         @Value("${app.s3.access-key}") String accessKey,
                         @Value("${app.s3.secret-key}") String secretKey) {
        // Fail at startup, not on the first upload.
        if (endpoint.isBlank() || bucket.isBlank() || accessKey.isBlank() || secretKey.isBlank()) {
            throw new IllegalStateException(
                    "app.storage.type=s3 needs S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY and S3_SECRET_KEY");
        }
        this.bucket = bucket;
        this.s3 = S3Client.builder()
                .endpointOverride(URI.create(endpoint))
                .region(Region.of(region))
                .credentialsProvider(StaticCredentialsProvider.create(AwsBasicCredentials.create(accessKey, secretKey)))
                // Garage serves buckets as paths (http://garage:3900/<bucket>), not subdomains.
                .forcePathStyle(true)
                // Only send the checksums S3 requires; newer AWS-only defaults
                // aren't understood by every S3-compatible server.
                .requestChecksumCalculation(RequestChecksumCalculation.WHEN_REQUIRED)
                .responseChecksumValidation(ResponseChecksumValidation.WHEN_REQUIRED)
                .httpClientBuilder(UrlConnectionHttpClient.builder())
                .build();
    }

    @Override
    public void put(String name, byte[] bytes, String contentType) {
        s3.putObject(req -> req.bucket(bucket).key(name).contentType(contentType), RequestBody.fromBytes(bytes));
    }

    @Override
    public Optional<StoredUpload> get(String name) {
        try {
            ResponseBytes<GetObjectResponse> object = s3.getObjectAsBytes(req -> req.bucket(bucket).key(name));
            GetObjectResponse meta = object.response();
            return Optional.of(new StoredUpload(object.asByteArray(), meta.contentType(), meta.lastModified()));
        } catch (NoSuchKeyException e) {
            return Optional.empty();
        }
    }

    @Override
    public void delete(String name) {
        // S3 deletes are idempotent: a missing key is not an error.
        s3.deleteObject(req -> req.bucket(bucket).key(name));
    }

    @Override
    public void close() {
        s3.close();
    }
}
