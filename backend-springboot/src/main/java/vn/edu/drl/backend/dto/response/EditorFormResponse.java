package vn.edu.drl.backend.dto.response;

import lombok.Data;
import vn.edu.drl.backend.enu.ScoreFormStatus;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Data
public class EditorFormResponse {
    private Long scoreFormId;
    private Long semesterId;
    private String semesterName;
    private String formName;
    private String versionNo;
    private ScoreFormStatus status;
    private BigDecimal studentTotal;
    private BigDecimal classTotal;
    private String templateLayoutJson;
    private String rejectReason;
    private String rejectedBy;
    private Instant rejectedAt;
    private String studentSignature;
    private String classSignature;
    private String deanSignature;
    private String classLeaderName;
    private String deanName;
    private List<EditorFormDetailResponse> details;

    @Data
    public static class EditorFormDetailResponse {
        private Long criteriaId;
        private String criteriaCode;
        private String title;
        private BigDecimal maxScore;
        private Boolean requiresProof;
        private BigDecimal studentScore;
        private BigDecimal classScore;
        private String proofUrl;
        private String note;
    }
}

