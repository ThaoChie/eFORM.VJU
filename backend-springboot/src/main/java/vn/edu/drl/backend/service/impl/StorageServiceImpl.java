package vn.edu.drl.backend.service.impl;

import vn.edu.drl.backend.service.*;

import vn.edu.drl.backend.service.StorageService;

import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.GetPresignedObjectUrlArgs;
import io.minio.http.Method;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.InputStream;
import java.util.concurrent.TimeUnit;
import java.util.UUID;

@Service
public class StorageServiceImpl implements StorageService {

    private final MinioClient minioClient;

    @Value("${minio.buckets.proofs}")
    private String proofsBucket;
    
    @Value("${minio.buckets.signatures}")
    private String signaturesBucket;
    
    @Value("${minio.buckets.signed-pdfs}")
    private String signedPdfsBucket;

    public StorageServiceImpl(
            @Value("${minio.endpoint}") String endpoint,
            @Value("${minio.access-key}") String accessKey,
            @Value("${minio.secret-key}") String secretKey) {
        this.minioClient = MinioClient.builder()
                .endpoint(endpoint)
                .credentials(accessKey, secretKey)
                .build();
    }

    public String uploadFile(MultipartFile file, String bucketName) throws Exception {
        String filename = UUID.randomUUID().toString();
        try (InputStream is = file.getInputStream()) {
            minioClient.putObject(
                PutObjectArgs.builder()
                    .bucket(bucketName)
                    .object(filename)
                    .stream(is, file.getSize(), -1)
                    .contentType(file.getContentType())
                    .build());
        }
        return filename;
    }

    public String uploadBytes(byte[] bytes, String bucketName, String contentType) throws Exception {
        String filename = UUID.randomUUID().toString();
        try (java.io.ByteArrayInputStream is = new java.io.ByteArrayInputStream(bytes)) {
            minioClient.putObject(
                PutObjectArgs.builder()
                    .bucket(bucketName)
                    .object(filename)
                    .stream(is, bytes.length, -1)
                    .contentType(contentType)
                    .build());
        }
        return filename;
    }

    public String getPresignedUrl(String bucketName, String objectName) throws Exception {
        return minioClient.getPresignedObjectUrl(
            GetPresignedObjectUrlArgs.builder()
                .method(Method.GET)
                .bucket(bucketName)
                .object(objectName)
                .expiry(1, TimeUnit.HOURS)
                .build());
    }

    public byte[] getFileBytes(String bucketName, String objectName) throws Exception {
        try (java.io.InputStream stream = minioClient.getObject(
            io.minio.GetObjectArgs.builder()
                .bucket(bucketName)
                .object(objectName)
                .build())) {
            return stream.readAllBytes();
        }
    }
}
