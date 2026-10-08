package vn.edu.drl.backend.dto.response;

import lombok.Data;
import java.time.Instant;

@Data
public class PublicVerifyResponse {
    private String status;
    private Instant approvedAt;
    private String hash;
    private String studentCodeMasked;
}
