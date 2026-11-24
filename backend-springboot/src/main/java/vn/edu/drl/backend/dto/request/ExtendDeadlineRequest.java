package vn.edu.drl.backend.dto.request;

import lombok.Data;

import java.time.LocalDate;

@Data
public class ExtendDeadlineRequest {
    /**
     * "ALL" (Mở rộng hạn chung) hoặc "EXCEPTION" (Mở lẻ cho Lớp/Khoa đặc thù)
     */
    private String extendScope = "ALL";

    /**
     * Trường cũ tương thích ngược (Hạn SV nộp bài mới)
     */
    private LocalDate newDeadline;

    private LocalDate newStudentDeadline;
    private LocalDate newClassDeadline;
    private LocalDate newDeanDeadline;

    // Cấu hình ngoại lệ mở lẻ
    private String targetType; // "CLASS" hoặc "DEPARTMENT"
    private Long targetId;
    private String targetName;
    private LocalDate exceptionDeadline;
    private String reason;
}
