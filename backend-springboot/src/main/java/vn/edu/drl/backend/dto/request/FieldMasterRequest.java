package vn.edu.drl.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Data;
import vn.edu.drl.backend.enu.FieldDataType;
import java.math.BigDecimal;

@Data
public class FieldMasterRequest {
    @NotBlank
    @Pattern(regexp = "^[a-z0-9_]+$", message = "field_code phải ở định dạng snake_case")
    private String fieldCode;

    @NotBlank
    private String fieldName;

    @NotNull
    private FieldDataType dataType;

    private String category;
    private Boolean isRequired;
    private BigDecimal minValue;
    private BigDecimal maxValue;
    private String regexPattern;
    private String description;
}
