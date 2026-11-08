package vn.edu.drl.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import vn.edu.drl.backend.enu.FieldDataType;
import vn.edu.drl.backend.model.FieldMasterHistory;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FieldMasterHistoryResponse {
    private Long id;
    private Long fieldId;
    private String version;
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
    private Instant createdAt;

    public FieldMasterHistoryResponse(FieldMasterHistory entity) {
        if (entity != null) {
            this.id = entity.getId();
            this.fieldId = entity.getFieldId();
            this.version = entity.getVersion();
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
            this.createdAt = entity.getCreatedAt();
        }
    }
}
