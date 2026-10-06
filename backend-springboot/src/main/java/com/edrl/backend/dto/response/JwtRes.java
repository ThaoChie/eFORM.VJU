// backend-springboot/src/main/java/com/edrl/backend/dto/response/JwtRes.java
package com.edrl.backend.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class JwtRes {
    
    // Chuỗi token để Frontend gắn vào Header (Authorization: Bearer ...) cho các request sau
    private String token;
    
    // Quyền của người dùng (STUDENT, CLASS_LEADER, DEAN, ADMIN) để FE phân quyền giao diện
    private String role;
    
    // Tên hiển thị trên góc phải màn hình
    private String fullName;
}