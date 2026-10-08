package vn.edu.drl.backend.dto.response;

import lombok.Data;
import java.time.LocalDate;

@Data
public class SemesterResponse {
    private Long id;
    private String semesterCode;
    private String semesterName;
    private String academicYear;
    private Boolean isActive;
    private LocalDate startDate;
    private LocalDate endDate;
}
