package vn.edu.drl.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import vn.edu.drl.backend.enu.FieldDataType;
import vn.edu.drl.backend.model.FieldMaster;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FieldMasterResponse {
    private Long id;
    private String fieldCode;
    private String fieldName;
    private FieldDataType dataType;
    private String category;
    private Boolean isRequired;
    private BigDecimal minValue;
    private BigDecimal maxValue;
    private String regexPattern;
    private String description;
    private Boolean isActive;
    private String version;
    private Instant updatedAt;
    private Instant createdAt;
    private List<FieldMasterHistoryResponse> versions = new ArrayList<>();

    public FieldMasterResponse(FieldMaster entity) {
        if (entity != null) {
            this.id = entity.getId();
            this.fieldCode = entity.getFieldCode();
            this.fieldName = entity.getFieldName();
            this.dataType = entity.getDataType();
            this.category = entity.getCategory();
            this.isRequired = entity.getIsRequired();
            this.minValue = entity.getMinValue();
            this.maxValue = entity.getMaxValue();
            this.regexPattern = entity.getRegexPattern();
            this.description = entity.getDescription();
            this.isActive = entity.getIsActive();
            this.version = entity.getVersion() != null ? entity.getVersion() : "1.0";
            this.updatedAt = entity.getUpdatedAt() != null ? entity.getUpdatedAt() : entity.getCreatedAt();
            this.createdAt = entity.getCreatedAt();
        }
    }
}
