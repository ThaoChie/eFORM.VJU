package vn.edu.drl.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class FormTemplateRequest {
    @NotBlank(message = "Form code is required")
    private String formCode;

    @NotBlank(message = "Form name is required")
    private String formName;

    @NotNull(message = "Semester ID is required")
    private Long semesterId;

    @NotBlank(message = "Template layout JSON is required")
    private String templateLayoutJson;
}
