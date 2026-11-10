package vn.edu.drl.backend.dto.request;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import java.util.List;

@Data
public class ClassRequest {
    @NotBlank
    private String classCode;
    @NotBlank
    private String className;
    private Long majorId;
    private Long deptId;
    private String academicCohort;
    private Integer status = 1;
    private List<Long> leaderIds;
    private List<Long> deputyIds;
}
