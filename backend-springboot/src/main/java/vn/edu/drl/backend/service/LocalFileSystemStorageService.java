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
@ConditionalOnProperty(name = "storage.provider", havingValue = "local")
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
    public String uploadFile(String bucketName, MultipartFile file) {
        try {
            String filename = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
            Path destinationFile = rootLocation.resolve(bucketName).resolve(filename);
            Files.copy(file.getInputStream(), destinationFile, StandardCopyOption.REPLACE_EXISTING);
            return filename;
        } catch (Exception e) {
            throw new RuntimeException("Failed to store file", e);
        }
    }

    @Override
    public String uploadFile(String bucketName, InputStream inputStream, String fileName, String contentType) {
        try {
            String filename = UUID.randomUUID().toString() + "_" + fileName;
            Path destinationFile = rootLocation.resolve(bucketName).resolve(filename);
            Files.copy(inputStream, destinationFile, StandardCopyOption.REPLACE_EXISTING);
            return filename;
        } catch (Exception e) {
            throw new RuntimeException("Failed to store file", e);
        }
    }

    @Override
    public InputStream getFile(String bucketName, String objectName) {
        try {
            Path file = rootLocation.resolve(bucketName).resolve(objectName);
            return Files.newInputStream(file);
        } catch (Exception e) {
            throw new RuntimeException("Could not read file", e);
        }
    }
    
    @Override
    public String getFileUrl(String bucketName, String objectName, int expiryMinutes) {
        // Return a local URL or base64 if needed, but typically for demo we might need an endpoint to serve files
        // A simple way is to add a controller to serve these files
        return "/api/v1/storage/" + bucketName + "/" + objectName;
    }
}
