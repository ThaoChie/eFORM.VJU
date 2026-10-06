// backend-springboot/src/main/java/com/edrl/backend/dto/response/UserRes.java
package com.edrl.backend.dto.response;

import com.edrl.backend.enu.Role;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UserRes {
    
    private Long id;
    
    private String userCode; // Mã Sinh viên hoặc Mã Cán bộ
    
    private String fullName;
    
    private String email;
    
    private Role role; // Sử dụng Enum Role
    
    private Long deptId; // ID Khoa (để frontend query lấy tên Khoa)
    
    private Long classId; // ID Lớp (để frontend query lấy tên Lớp)
    
    private Boolean isSigner; // Cờ xác định có quyền ký số hay không
    
    private Boolean isActive; // Trạng thái tài khoản (đang hoạt động hay bị khóa)
}