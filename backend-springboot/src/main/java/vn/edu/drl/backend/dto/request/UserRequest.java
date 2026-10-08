package vn.edu.drl.backend.dto.request;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
@Data
public class UserRequest {
    private String userCode;
    @NotBlank
    private String fullName;
    @NotBlank
    private String email;
    @NotBlank
    private String role;
    private String positionTitle;
    private Long deptId;
    private Long classId;
    private String academicCohort;
}
