package vn.edu.drl.backend.dto.response;

import lombok.Data;
import vn.edu.drl.backend.enu.FieldDataType;
import vn.edu.drl.backend.model.FieldMaster;
import java.math.BigDecimal;
import java.time.Instant;

@Data
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
    private Instant createdAt;

    public FieldMasterResponse(FieldMaster entity) {
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
        this.createdAt = entity.getCreatedAt();
    }
}
