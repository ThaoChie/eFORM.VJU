package vn.edu.drl.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeanBatchResponse {
    private Long id;
    private String classCode;
    private String className;
    private Long size;
    private Long pending;
    private Long done;
    private Long submitted;
    private String reviewer;
    private String status;
}
