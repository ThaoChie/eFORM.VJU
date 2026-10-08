const fs = require('fs');

// 1. Add CLASS_DEPUTY to Role
let rolePath = 'src/main/java/vn/edu/drl/backend/enu/Role.java';
let roleContent = fs.readFileSync(rolePath, 'utf-8');
roleContent = roleContent.replace('CLASS_LEADER,', 'CLASS_LEADER, CLASS_DEPUTY,');
fs.writeFileSync(rolePath, roleContent);

// 2. Add properties to ClassRequest
let reqPath = 'src/main/java/vn/edu/drl/backend/dto/request/ClassRequest.java';
let reqContent = `package vn.edu.drl.backend.dto.request;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.List;

@Data
public class ClassRequest {
    @NotBlank
    private String classCode;
    @NotBlank
    private String className;
    @NotNull
    private Long deptId;
    private String academicCohort;
    private Integer status = 1;
    private List<Long> leaderIds;
    private List<Long> deputyIds;
}
`;
fs.writeFileSync(reqPath, reqContent);

// 3. Create ClassResponse
let resPath = 'src/main/java/vn/edu/drl/backend/dto/response/ClassResponse.java';
let resContent = `package vn.edu.drl.backend.dto.response;
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
`;
fs.writeFileSync(resPath, resContent);
