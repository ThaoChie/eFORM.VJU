package vn.edu.drl.backend.dto.request;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
@Data
public class DepartmentRequest {
    @NotBlank
    private String deptCode;
    @NotBlank
    private String deptName;
    private Integer status;
    private Long deanId;
}
