package vn.edu.drl.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class EvaluationPeriodRequest {
    @NotBlank(message = "Mã đợt chấm không được để trống")
    private String periodCode;

    @NotNull(message = "Học kỳ không được để trống")
    private Long semesterId;

    @NotNull(message = "Phiên bản biểu mẫu không được để trống")
    private Long formVersionId;

    @NotBlank(message = "Phạm vi áp dụng không được để trống")
    private String applicationScope;

    private List<Long> applicableDepartmentIds;

    @NotNull(message = "Ngày bắt đầu mở đợt không được để trống")
    private LocalDate startDate;

    @NotNull(message = "Hạn chót sinh viên nộp bài không được để trống")
    private LocalDate studentDeadline;

    @NotNull(message = "Hạn chót lớp thẩm định không được để trống")
    private LocalDate classDeadline;

    @NotNull(message = "Hạn chót khoa duyệt lô không được để trống")
    private LocalDate deanDeadline;

    /**
     * Tương thích ngược: nếu client gửi submissionDeadline thì dùng làm studentDeadline
     */
    private LocalDate submissionDeadline;
}
