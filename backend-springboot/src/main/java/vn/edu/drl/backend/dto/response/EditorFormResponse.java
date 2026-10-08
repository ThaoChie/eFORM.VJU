package vn.edu.drl.backend.dto.response;

import lombok.Data;
import vn.edu.drl.backend.enu.ScoreFormStatus;
import java.math.BigDecimal;
import java.util.List;

@Data
public class EditorFormResponse {
    private Long scoreFormId;
    private ScoreFormStatus status;
    private BigDecimal studentTotal;
    private String templateLayoutJson;
    private List<EditorFormDetailResponse> details;

    @Data
    public static class EditorFormDetailResponse {
        private Long criteriaId;
        private String criteriaCode;
        private String title;
        private BigDecimal maxScore;
        private Boolean requiresProof;
        private BigDecimal studentScore;
        private String proofUrl;
        private String note;
    }
}
