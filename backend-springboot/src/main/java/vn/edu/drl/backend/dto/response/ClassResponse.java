package vn.edu.drl.backend.dto.response;
import lombok.Data;
import java.util.List;

@Data
public class ClassResponse {
    private Long id;
    private String classCode;
    private String className;
    private String academicCohort;
    private Integer status;
    private Long deptId;
    private String deptCode;
    private String deptName;
    private String deanName;
    private long studentCount;
    private List<UserDto> leaders;
    private List<UserDto> deputies;

    @Data
    public static class UserDto {
        private Long id;
        private String userCode;
        private String fullName;
    }
}
