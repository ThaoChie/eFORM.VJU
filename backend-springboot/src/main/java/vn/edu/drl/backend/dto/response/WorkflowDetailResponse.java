package vn.edu.drl.backend.dto.response;

import lombok.Data;
import vn.edu.drl.backend.enu.ScoreFormStatus;
import java.math.BigDecimal;
import java.util.List;

@Data
public class WorkflowDetailResponse {
    private Long scoreFormId;
    private String studentName;
    private String studentCode;
    private String className;
    private ScoreFormStatus status;
    private BigDecimal studentTotal;
    private BigDecimal classTotal;
    private BigDecimal finalTotal;
    private String templateLayoutJson;
    private List<WorkflowDetailItem> details;
    
    // We should also include audit logs here or in a separate API, but the task says "lịch sử audit_logs, chữ ký", let's leave it for now or add them later.

    @Data
    public static class WorkflowDetailItem {
        private Long criteriaId;
        private String criteriaCode;
        private String title;
        private BigDecimal maxScore;
        private Boolean requiresProof;
        private BigDecimal studentScore;
        private BigDecimal classScore;
        private String proofUrl;
        private String studentNote;
        private String classNote;
    }
}
