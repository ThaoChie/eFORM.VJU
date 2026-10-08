package vn.edu.drl.backend.service;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
@ConditionalOnProperty(name = "storage.provider", havingValue = "s3")
public class S3StorageService implements StorageService {

    @Override
    public String uploadFile(MultipartFile file, String bucketName) throws Exception {
        return "dummy_filename";
    }

    @Override
    public String uploadBytes(byte[] bytes, String bucketName, String contentType) throws Exception {
        return "dummy_filename";
    }

    @Override
    public String getPresignedUrl(String bucketName, String objectName) throws Exception {
        return "https://dummy-s3-url/" + bucketName + "/" + objectName;
    }

    @Override
    public byte[] getFileBytes(String bucketName, String objectName) throws Exception {
        return new byte[0];
    }
}
