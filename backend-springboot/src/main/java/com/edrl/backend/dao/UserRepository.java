// backend-springboot/src/main/java/com/edrl/backend/dao/UserRepository.java
package com.edrl.backend.dao;

import com.edrl.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    
    // Tìm kiếm User theo Email (Dùng cho đăng nhập)
    Optional<User> findByEmail(String email);
    
    // Tìm kiếm User theo Mã định danh (Mã SV / Mã CB)
    Optional<User> findByUserCode(String userCode);
    
    // Kiểm tra xem Mã định danh hoặc Email đã tồn tại chưa (Dùng khi tạo mới/Import)
    boolean existsByUserCodeOrEmail(String userCode, String email);
}