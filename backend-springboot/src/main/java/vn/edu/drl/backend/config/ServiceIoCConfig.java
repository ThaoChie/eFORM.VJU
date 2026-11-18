package vn.edu.drl.backend.config;

import org.springframework.context.annotation.Configuration;

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
 * 2. Multi-implementation Provider Resolution:
 *    - Các implementation của StorageService (StorageServiceImpl, S3StorageService, LocalFileSystemStorageService)
 *      được Spring Boot tự động phân giải động theo cấu hình 'storage.provider' thông qua @ConditionalOnProperty và @Primary.
 *
 * 3. Service Registry:
 *    - Toàn bộ 21 Service Interfaces đặt tại package: vn.edu.drl.backend.service.interfaces
 *    - Toàn bộ Implementations đặt tại package: vn.edu.drl.backend.service.impl
 */
@Configuration
public class ServiceIoCConfig {
    // Registry và configuration documentation cho IoC Container
}
