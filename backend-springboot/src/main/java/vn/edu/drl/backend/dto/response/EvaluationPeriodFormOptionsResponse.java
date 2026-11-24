package vn.edu.drl.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EvaluationPeriodFormOptionsResponse {
    private List<SemesterOption> semesters;
    private List<FormVersionOption> formVersions;
    private List<DepartmentOption> departments;
    private List<ClassOption> classes;
    private List<String> scopes;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SemesterOption {
        private Long id;
        private String semesterCode;
        private String semesterName;
        private String academicYear;
        private Boolean isActive;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FormVersionOption {
        private Long id;
        private Long semesterId;
        private String formCode;
        private String formName;
        private String versionNo;
        private String status;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DepartmentOption {
        private Long id;
        private String deptCode;
        private String deptName;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ClassOption {
        private Long id;
        private String classCode;
        private String className;
        private Long departmentId;
    }
}
