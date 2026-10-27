package vn.edu.drl.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RejectRequest {
    private String rejectReason;
    private String reason;

    public String getEffectiveReason() {
        if (rejectReason != null && !rejectReason.isBlank()) return rejectReason;
        if (reason != null && !reason.isBlank()) return reason;
        return "Từ chối phiếu rèn luyện";
    }
}
