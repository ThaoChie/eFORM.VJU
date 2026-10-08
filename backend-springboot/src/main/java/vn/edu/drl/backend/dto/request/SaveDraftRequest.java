package vn.edu.drl.backend.dto.request;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class SaveDraftRequest {
    private Long semesterId;
    private List<DraftDetail> details;

    @Data
    public static class DraftDetail {
        private Long criteriaId;
        private BigDecimal studentScore;
        private String proofUrl;
    }
}
