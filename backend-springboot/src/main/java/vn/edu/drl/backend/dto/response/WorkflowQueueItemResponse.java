package vn.edu.drl.backend.dto.response;

import lombok.Data;
import vn.edu.drl.backend.enu.ScoreFormStatus;
import java.math.BigDecimal;
import java.time.Instant;

@Data
public class WorkflowQueueItemResponse {
    private Long id;
    private Long studentId;
    private String studentCode;
    private String studentName;
    private String className;
    private ScoreFormStatus status;
    private BigDecimal studentTotal;
    private BigDecimal classTotal;
    private BigDecimal finalTotal;
    private String departmentName;
    private String academicCohort;
    private String ranking;
    private String pdfFileUrl;
    private Instant submittedAt; // Map to createdAt or updatedAt depending on the business logic
}
