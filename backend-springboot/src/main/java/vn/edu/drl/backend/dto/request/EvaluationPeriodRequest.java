package vn.edu.drl.backend.dto.request;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class EvaluationPeriodRequest {
    @NotNull(message = "Học kỳ không được để trống")
    private Long semesterId;

    @NotNull(message = "Phiên bản biểu mẫu không được để trống")
    private Long formVersionId;

    @NotBlank(message = "Phạm vi áp dụng không được để trống")
    private String applicationScope;

    @NotNull(message = "Hạn nộp không được để trống")
    @FutureOrPresent(message = "Hạn nộp không được trước ngày hiện tại")
    private LocalDate submissionDeadline;
}
