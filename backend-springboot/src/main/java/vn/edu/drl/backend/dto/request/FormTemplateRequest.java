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

    private Long semesterId;

    private String templateLayoutJson;

    private String versionNo;
    private vn.edu.drl.backend.enu.FormVersionStatus status;
    private String description;
}
