package vn.edu.drl.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import java.time.LocalDate;

@Data
public class SemesterRequest {
    @NotBlank(message = "Semester code is required")
    private String semesterCode;

    @NotBlank(message = "Semester name is required")
    private String semesterName;

    @NotBlank(message = "Academic year is required")
    private String academicYear;

    private Boolean isActive = false;
    private LocalDate startDate;
    private LocalDate endDate;
}
