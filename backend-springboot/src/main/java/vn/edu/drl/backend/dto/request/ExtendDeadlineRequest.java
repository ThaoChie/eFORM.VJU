package vn.edu.drl.backend.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class ExtendDeadlineRequest {
    @NotNull(message = "Hạn nộp mới không được để trống")
    private LocalDate newDeadline;
}
