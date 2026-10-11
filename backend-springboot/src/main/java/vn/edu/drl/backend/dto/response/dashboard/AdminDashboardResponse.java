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
public class AdminDashboardResponse {
    private long totalStudents;
    private long pendingApprovals;
    private long completedForms;
    private double completionRate;
    private List<String> warnings;
    private List<DepartmentProgressDto> departmentProgress;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DepartmentProgressDto {
        private Long departmentId;
        private String departmentName;
        private long totalStudents;
        private long completedCount;
        private double progressPercent;
    }
}
