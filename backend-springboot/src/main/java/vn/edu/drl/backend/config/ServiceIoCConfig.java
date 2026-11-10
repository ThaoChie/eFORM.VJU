package vn.edu.drl.backend.config;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import vn.edu.drl.backend.service.LocalFileSystemStorageService;
import vn.edu.drl.backend.service.S3StorageService;
import vn.edu.drl.backend.service.StorageService;
import vn.edu.drl.backend.service.impl.StorageServiceImpl;

/**
 * CẤU HÌNH TẬP TRUNG IoC / DI CONTAINER (Inversion of Control & Dependency Injection)
 * =================================================================================
 * Quản trị tập trung toàn bộ mapping giữa Service Abstractions (Interfaces) và
 * Concrete Implementations trong toàn bộ hệ thống backend E-Form VJU.
 *
 * NGUYÊN TẮC THIẾT KẾ & KIẾN TRÚC:
 * 1. Dependency Inversion Principle (DIP):
 *    - Các Controller và Client layers CHỈ ĐƯỢC PHÉP phụ thuộc vào Interface (Abstraction),
 *      tuyệt đối không tham chiếu hay khởi tạo trực tiếp concrete implementation (*ServiceImpl).
 *    - 100% Controller sử dụng Constructor Injection (thông qua @RequiredArgsConstructor / private final)
 *      để đảm bảo tính bất biến (immutability), fail-fast khi thiếu bean, và dễ dàng Unit Test độc lập.
 *
 * 2. Centralized Mapping & Hot-swappable Implementations:
 *    - Toàn bộ việc mapping và điều phối implementation được cấu hình tại đây.
 *    - Khi cần chuyển đổi nhà cung cấp (Storage: MinIO <-> AWS S3 <-> Local Disk),
 *      hoặc áp dụng Caching Proxy, Audit Decorator, Multi-tenancy Dispatcher, hay Mock Service,
 *      ta chỉ cần cấu hình tại DI Container này mà KHÔNG LÀM BIẾN ĐỘNG bất kỳ Controller nào.
 */
@Configuration
public class ServiceIoCConfig {

    // =========================================================================
    // 1. STORAGE SERVICE ABSTRACTION MAPPING
    // Cho phép switch linh hoạt giữa 3 implementations:
    //   - MinIO (Mặc định cho môi trường Production / On-Premise)
    //   - AWS S3 (Khi deploy Cloud AWS)
    //   - Local File System (Cho môi trường Local Dev / Offline Testing)
    // =========================================================================

    @Bean
    @Primary
    @ConditionalOnProperty(name = "storage.provider", havingValue = "minio", matchIfMissing = true)
    public StorageService minioStorageService(StorageServiceImpl storageServiceImpl) {
        return storageServiceImpl;
    }

    @Bean
    @ConditionalOnProperty(name = "storage.provider", havingValue = "s3")
    public StorageService s3StorageService(S3StorageService s3StorageService) {
        return s3StorageService;
    }

    @Bean
    @ConditionalOnProperty(name = "storage.provider", havingValue = "local")
    public StorageService localStorageService(LocalFileSystemStorageService localFileSystemStorageService) {
        return localFileSystemStorageService;
    }

    // =========================================================================
    // 2. SERVICE ABSTRACTION REGISTRY / DOCUMENTATION
    // Các mapping Interface -> Implementation được Spring Boot IoC Container
    // quản lý tự động theo mô hình Single Implementation per Abstraction:
    //
    //   - AdminApprovalService       -> AdminApprovalServiceImpl
    //   - AuditService               -> AuditServiceImpl
    //   - AuthService                -> AuthServiceImpl
    //   - ClassService               -> ClassServiceImpl
    //   - CriteriaService            -> CriteriaServiceImpl
    //   - DashboardService           -> DashboardServiceImpl
    //   - DepartmentService          -> DepartmentServiceImpl
    //   - EditorService              -> EditorServiceImpl
    //   - EvaluationPeriodService    -> EvaluationPeriodServiceImpl
    //   - FieldMasterService         -> FieldMasterServiceImpl
    //   - FormVersionService         -> FormVersionServiceImpl
    //   - MajorService               -> MajorServiceImpl
    //   - NotificationService        -> NotificationServiceImpl
    //   - OfficeService              -> OfficeServiceImpl
    //   - PublicVerifyService        -> PublicVerifyServiceImpl
    //   - ReportService              -> ReportServiceImpl
    //   - SemesterService            -> SemesterServiceImpl
    //   - UserService                -> UserServiceImpl
    //   - WorkflowBatchHelperService -> WorkflowBatchHelperServiceImpl
    //   - WorkflowService            -> WorkflowServiceImpl
    // =========================================================================
}
