// backend-springboot/src/main/java/com/edrl/backend/dto/request/UserCreateReq.java
package com.edrl.backend.dto.request;

import com.edrl.backend.enu.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UserCreateReq {

    // ==========================================================
    // CÁC TRƯỜNG BẮT BUỘC (MANDATORY FIELDS)
    // ==========================================================

    @NotBlank(message = "Mã định danh (Mã SV / Mã CB) không được để trống")
    private String userCode;

    @NotBlank(message = "Họ và tên không được để trống")
    private String fullName;

    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không đúng định dạng")
    private String email;

    @NotBlank(message = "Mật khẩu không được để trống")
    @Size(min = 6, message = "Mật khẩu phải có độ dài từ 6 ký tự trở lên")
    private String password;

    @NotNull(message = "Vai trò (Role) không được để trống")
    private Role role; // Sử dụng Enum Role (STUDENT, CLASS_LEADER, DEAN, ADMIN)

    // ==========================================================
    // CÁC TRƯỜNG TÙY CHỌN (OPTIONAL FIELDS)
    // ==========================================================

    private String positionTitle;   // Chức vụ (Bí thư, Phó bí thư...)
    
    private Long deptId;            // ID của Khoa (Trỏ tới bảng departments)
    
    private Long classId;           // ID của Lớp (Trỏ tới bảng classes)
    
    private String academicCohort;  // Khóa học (Ví dụ: K65, K66)
    
    private Boolean isSigner;       // Cờ đánh dấu người này có được phép ký số không
}