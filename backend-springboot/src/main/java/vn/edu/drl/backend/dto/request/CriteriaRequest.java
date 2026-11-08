package vn.edu.drl.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class CriteriaRequest {
    @NotNull(message = "Semester ID is required")
    private Long semesterId;

    @NotNull(message = "Field ID is required")
    private Long fieldId;

    @NotBlank(message = "Criteria code is required")
    private String criteriaCode;

    @NotBlank(message = "Title is required")
    private String title;

    private String category;

    @NotNull(message = "Max score is required")
    private BigDecimal maxScore;

    private Boolean requiresProof = false;
    private Integer orderIndex = 0;
}
