package vn.edu.drl.backend.dto.request;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class ClassApproveRequest {
    private List<DraftDetail> details;
    private String signatureBase64;
    private String note;

    @Data
    public static class DraftDetail {
        private Long criteriaId;
        private BigDecimal classScore;
        private String note;
    }
}
