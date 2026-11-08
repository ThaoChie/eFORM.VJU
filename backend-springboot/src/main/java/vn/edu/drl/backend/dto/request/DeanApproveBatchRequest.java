package vn.edu.drl.backend.dto.request;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.List;

@Data
public class DeanApproveBatchRequest {
    @NotEmpty(message = "List of score form IDs cannot be empty")
    private List<Long> ids;

    @NotNull(message = "Signature is required")
    private String signatureBase64;
}
