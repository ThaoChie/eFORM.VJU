// backend-springboot/src/main/java/com/edrl/backend/dao/DepartmentRepository.java
package com.edrl.backend.dao;

import com.edrl.backend.model.Department;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DepartmentRepository extends JpaRepository<Department, Long> {
    
    // Tìm Khoa theo mã (Ví dụ: "CNTT", "KTE")
    Optional<Department> findByDeptCode(String deptCode);
    
    // Kiểm tra mã Khoa đã tồn tại chưa để chặn lỗi Duplicate Key
    boolean existsByDeptCode(String deptCode);
}