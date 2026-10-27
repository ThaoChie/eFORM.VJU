package vn.edu.drl.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminApprovalItemResponse {
    private Long id;
    private String type;         // "FORM_VERSION", "FIELD_CODE", "SCORE_FORM"
    private String typeName;     // "Phiên bản biểu mẫu", "Trường thông tin", "Phiếu ĐRL"
    private String code;         // e.g. DRL-2026, FIELD_01, SV2311001
    private String name;         // e.g. Tên biểu mẫu, Tên trường, Tên sinh viên
    private String requestType;  // "Yêu cầu kích hoạt", "Tạo mới", "Duyệt phiếu"
    private String owner;        // Tên người gửi yêu cầu (Maker)
    private Long ownerId;
    private Instant date;        // Ngày gửi
    private boolean own;         // true nếu Maker là chính user đang đăng nhập (Checker bị cấm tự duyệt)
    private String status;       // "DRAFT", "PENDING", "SUBMITTED", "CLASS_APPROVED"
    private String description;
}
