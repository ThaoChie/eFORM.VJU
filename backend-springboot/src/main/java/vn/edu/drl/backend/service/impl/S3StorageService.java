package vn.edu.drl.backend.service.impl;

import io.minio.GetObjectArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import vn.edu.drl.backend.service.interfaces.StorageService;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
@ConditionalOnProperty(name = "storage.provider", havingValue = "s3")
public class S3StorageService implements StorageService {

    private static final Logger log = LoggerFactory.getLogger(S3StorageService.class);
    private final Path rootLocation = Paths.get("/tmp/drl-storage");

    @Value("${s3.endpoint:${minio.endpoint:http://localhost:9000}}")
    private String endpoint;

    @Value("${s3.access-key:${minio.access-key:minioadmin}}")
    private String accessKey;

    @Value("${s3.secret-key:${minio.secret-key:minioadmin}}")
    private String secretKey;

    private MinioClient minioClient;
    private boolean s3Available = false;

    @PostConstruct
    public void init() {
        try {
            Files.createDirectories(rootLocation.resolve("proofs"));
            Files.createDirectories(rootLocation.resolve("signatures"));
            Files.createDirectories(rootLocation.resolve("signed-pdfs"));
        } catch (Exception e) {
            log.warn("Could not create local storage directory: {}", e.getMessage());
        }

        try {
            if (endpoint != null && !endpoint.trim().isEmpty() && !endpoint.contains("dummy")) {
                this.minioClient = MinioClient.builder()
                        .endpoint(endpoint)
                        .credentials(accessKey, secretKey)
                        .build();
                this.s3Available = true;
                log.info("S3StorageService initialized with endpoint: {}", endpoint);
            }
        } catch (Exception e) {
            log.warn("S3StorageService failed to connect to S3 endpoint: {}. Fallback to local storage enabled.", e.getMessage());
            this.s3Available = false;
        }
    }

    @Override
    public String uploadFile(MultipartFile file, String bucketName) throws Exception {
        String original = file.getOriginalFilename() != null ? file.getOriginalFilename() : "file";
        String cleanName = original.replaceAll("[^a-zA-Z0-9._-]", "_");
        String filename = UUID.randomUUID().toString() + "_" + cleanName;

        // 1. Luôn lưu một bản sao cục bộ trên disk để đảm bảo 100% không mất file
        try {
            Path destinationFile = rootLocation.resolve(bucketName).resolve(filename);
            Files.createDirectories(destinationFile.getParent());
            try (InputStream is = file.getInputStream()) {
                Files.copy(is, destinationFile, StandardCopyOption.REPLACE_EXISTING);
            }
        } catch (Exception e) {
            log.warn("Local storage backup failed for {}: {}", filename, e.getMessage());
        }

        // 2. Upload lên S3 nếu S3 sẵn sàng
        if (s3Available && minioClient != null) {
            try (InputStream is = file.getInputStream()) {
                minioClient.putObject(
                        PutObjectArgs.builder()
                                .bucket(bucketName)
                                .object(filename)
                                .stream(is, file.getSize(), -1)
                                .contentType(file.getContentType())
                                .build()
                );
                log.info("Uploaded file to S3 bucket {}: {}", bucketName, filename);
            } catch (Exception e) {
                log.warn("Upload to S3 failed for {}, serving from local disk: {}", filename, e.getMessage());
            }
        }

        return filename;
    }

    @Override
    public String uploadBytes(byte[] bytes, String bucketName, String contentType) throws Exception {
        String filename = UUID.randomUUID().toString();
        if ("application/pdf".equals(contentType)) {
            filename += ".pdf";
        } else if ("image/png".equals(contentType)) {
            filename += ".png";
        }

        // 1. Lưu bản sao cục bộ
        try {
            Path destinationFile = rootLocation.resolve(bucketName).resolve(filename);
            Files.createDirectories(destinationFile.getParent());
            Files.write(destinationFile, bytes);
        } catch (Exception e) {
            log.warn("Local storage backup failed for {}: {}", filename, e.getMessage());
        }

        // 2. Upload lên S3 nếu có
        if (s3Available && minioClient != null) {
            try (ByteArrayInputStream is = new ByteArrayInputStream(bytes)) {
                minioClient.putObject(
                        PutObjectArgs.builder()
                                .bucket(bucketName)
                                .object(filename)
                                .stream(is, bytes.length, -1)
                                .contentType(contentType)
                                .build()
                );
            } catch (Exception e) {
                log.warn("Upload bytes to S3 failed for {}: {}", filename, e.getMessage());
            }
        }

        return filename;
    }

    @Override
    public String getPresignedUrl(String bucketName, String objectName) throws Exception {
        if (s3Available && minioClient != null) {
            try {
                return minioClient.getPresignedObjectUrl(
                        io.minio.GetPresignedObjectUrlArgs.builder()
                                .method(io.minio.http.Method.GET)
                                .bucket(bucketName)
                                .object(objectName)
                                .expiry(1, java.util.concurrent.TimeUnit.HOURS)
                                .build()
                );
            } catch (Exception ignored) {}
        }
        return "/api/v1/editor/proofs/" + objectName;
    }

    @Override
    public byte[] getFileBytes(String bucketName, String objectName) throws Exception {
        // 1. Thử đọc từ S3 nếu sẵn sàng
        if (s3Available && minioClient != null) {
            try (InputStream stream = minioClient.getObject(
                    GetObjectArgs.builder()
                            .bucket(bucketName)
                            .object(objectName)
                            .build())) {
                byte[] data = stream.readAllBytes();
                if (data != null && data.length > 0) {
                    return data;
                }
            } catch (Exception e) {
                log.warn("S3 getObject failed for {}, checking local disk fallback: {}", objectName, e.getMessage());
            }
        }

        // 2. Fallback đọc từ thư mục cục bộ /tmp/drl-storage/{bucketName}/{objectName}
        Path localFile = rootLocation.resolve(bucketName).resolve(objectName);
        if (Files.exists(localFile)) {
            return Files.readAllBytes(localFile);
        }

        // 3. Fallback tìm file theo tên hoặc prefix trong thư mục
        Path bucketDir = rootLocation.resolve(bucketName);
        if (Files.exists(bucketDir)) {
            try (java.util.stream.Stream<Path> stream = Files.list(bucketDir)) {
                java.util.Optional<Path> match = stream
                        .filter(p -> p.getFileName().toString().contains(objectName) || objectName.contains(p.getFileName().toString()))
                        .findFirst();
                if (match.isPresent()) {
                    return Files.readAllBytes(match.get());
                }
            } catch (Exception ignored) {}
        }

        return new byte[0];
    }
}
