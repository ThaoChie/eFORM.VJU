package vn.edu.drl.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class SubmitFormRequest {
    @NotNull(message = "Semester ID is required")
    private Long semesterId;
    
    @NotBlank(message = "Signature is required")
    private String signatureBase64;
}
