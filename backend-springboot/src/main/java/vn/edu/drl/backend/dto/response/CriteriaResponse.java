package vn.edu.drl.backend.dto.response;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class CriteriaResponse {
    private Long id;
    private Long semesterId;
    private Long fieldId;
    private String criteriaCode;
    private String title;
    private String category;
    private BigDecimal maxScore;
    private Boolean requiresProof;
    private Integer orderIndex;
}
