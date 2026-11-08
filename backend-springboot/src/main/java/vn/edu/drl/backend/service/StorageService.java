package vn.edu.drl.backend.service;

import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.GetPresignedObjectUrlArgs;
import io.minio.http.Method;
import org.springframework.web.multipart.MultipartFile;
import java.io.InputStream;
import java.util.concurrent.TimeUnit;
import java.util.UUID;


public interface StorageService {

    String uploadFile(MultipartFile file, String bucketName) throws Exception;
    String uploadBytes(byte[] bytes, String bucketName, String contentType) throws Exception;
    String getPresignedUrl(String bucketName, String objectName) throws Exception;
    byte[] getFileBytes(String bucketName, String objectName) throws Exception;
}
