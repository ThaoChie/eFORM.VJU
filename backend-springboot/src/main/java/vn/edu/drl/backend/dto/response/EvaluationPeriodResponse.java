package vn.edu.drl.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import vn.edu.drl.backend.enu.EvaluationPeriodStatus;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EvaluationPeriodResponse {
    private Long id;
    
    // Semester info
    private Long semesterId;
    private String semesterCode;
    private String semesterName;
    private String academicYear;

    // Form version info
    private Long formVersionId;
    private String formCode;
    private String formVersionNo;
    private String formName;

    // Period details
    private String applicationScope;
    private LocalDate submissionDeadline;
    private EvaluationPeriodStatus status;
    private String statusDisplayName;
    private Long remainingDays;

    // Meta
    private String createdByName;
    private Instant createdAt;
    private Instant updatedAt;

    // History (UC018 R)
    private List<AuditLogItem> history;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AuditLogItem {
        private Long id;
        private String actorName;
        private String action;
        private String actionDisplayName;
        private String fromStatus;
        private String toStatus;
        private String note;
        private Instant createdAt;
    }
}
