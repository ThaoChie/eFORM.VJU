package vn.edu.drl.backend.service;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;
import jakarta.annotation.PostConstruct;

@Service
@ConditionalOnProperty(name = "storage.provider", havingValue = "local", matchIfMissing = false)
public class LocalFileSystemStorageService implements StorageService {
    private final Path rootLocation = Paths.get("/tmp/drl-storage");

    @PostConstruct
    public void init() {
        try {
            Files.createDirectories(rootLocation.resolve("proofs"));
            Files.createDirectories(rootLocation.resolve("signatures"));
            Files.createDirectories(rootLocation.resolve("signed-pdfs"));
        } catch (Exception e) {
            throw new RuntimeException("Could not initialize storage", e);
        }
    }

    @Override
    public String uploadFile(MultipartFile file, String bucketName) throws Exception {
        String filename = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
        Path destinationFile = rootLocation.resolve(bucketName).resolve(filename);
        Files.copy(file.getInputStream(), destinationFile, StandardCopyOption.REPLACE_EXISTING);
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
        Path destinationFile = rootLocation.resolve(bucketName).resolve(filename);
        Files.write(destinationFile, bytes);
        return filename;
    }

    @Override
    public String getPresignedUrl(String bucketName, String objectName) throws Exception {
        return "/api/v1/storage/" + bucketName + "/" + objectName;
    }

    @Override
    public byte[] getFileBytes(String bucketName, String objectName) throws Exception {
        Path file = rootLocation.resolve(bucketName).resolve(objectName);
        return Files.readAllBytes(file);
    }
}
