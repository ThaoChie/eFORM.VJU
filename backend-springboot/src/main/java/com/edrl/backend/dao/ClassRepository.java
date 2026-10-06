// backend-springboot/src/main/java/com/edrl/backend/dao/ClassRepository.java
package com.edrl.backend.dao;

import com.edrl.backend.model.ClassEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClassRepository extends JpaRepository<ClassEntity, Long> {
    
    // Tìm Lớp theo mã lớp (Ví dụ: "CNTT1-K65")
    Optional<ClassEntity> findByClassCode(String classCode);
    
    // Kiểm tra mã Lớp đã tồn tại chưa
    boolean existsByClassCode(String classCode);
    
    // Lấy toàn bộ danh sách Lớp thuộc về một Khoa cụ thể
    List<ClassEntity> findByDeptId(Long deptId);
}