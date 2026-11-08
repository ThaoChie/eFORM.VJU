package vn.edu.drl.backend.dto.response;

import lombok.Data;
import java.util.List;

@Data
public class DeanApproveBatchResponse {
    private int total;
    private int success;
    private int failed;
    private List<BatchResult> results;

    @Data
    public static class BatchResult {
        private Long scoreFormId;
        private boolean success;
        private String errorReason;
    }
}
