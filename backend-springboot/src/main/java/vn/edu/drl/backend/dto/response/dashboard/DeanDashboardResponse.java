package vn.edu.drl.backend.dto.response.dashboard;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeanDashboardResponse {
    private Long departmentId;
    private String departmentName;
    private String semesterName;
    private long totalStudents;
    private long pendingForms;
    private long pendingBatches;
    private long completedForms;
    private List<ClassProgressDto> classesProgress;
    private List<WarningStudentDto> warningStudents;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ClassProgressDto {
        private Long classId;
        private String classCode;
        private String className;
        private long totalStudents;
        private long completedCount;
        private double progressPercent;
        private boolean slow;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WarningStudentDto {
        private Long id;
        private String name;
        private String code;
        private String className;
        private Double score;
        private String ranking;
        private String status;
        private String reason;
    }
}
