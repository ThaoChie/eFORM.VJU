package vn.edu.drl.backend.service;

import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.multipart.MultipartFile;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class StorageServiceTest {

    @Mock
    private MinioClient minioClient;

    private StorageService storageService;

    @BeforeEach
    void setUp() {
        storageService = new StorageService("http://localhost", "access", "secret");
        ReflectionTestUtils.setField(storageService, "minioClient", minioClient);
    }

    @Test
    void uploadFile_Success() throws Exception {
        MultipartFile file = new MockMultipartFile("file", "test.txt", "text/plain", "content".getBytes());
        
        String filename = storageService.uploadFile(file, "test-bucket");
        
        assertNotNull(filename);
        verify(minioClient, times(1)).putObject(any(PutObjectArgs.class));
    }
}
