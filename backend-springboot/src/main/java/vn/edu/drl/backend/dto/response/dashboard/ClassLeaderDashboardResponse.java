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
public class ClassLeaderDashboardResponse {
    private Long classId;
    private String classCode;
    private String className;
    private String semesterName;
    private long totalStudents;
    private long completedCount;
    private long pendingCount;
    private double averageScore;
    private ProgressBreakdownDto progressBreakdown;
    private List<RankingDistributionDto> rankingDistribution;
    private List<StudentRowDto> students;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProgressBreakdownDto {
        private long notSubmitted;
        private long waitingClass;
        private long waitingDean;
        private long completed;
        private long rejected;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RankingDistributionDto {
        private String label; // "XS", "Tốt", "Khá", "TB", "Yếu", "Kém"
        private long count;
        private double percent;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StudentRowDto {
        private Long id;
        private String name;
        private String code;
        private String className;
        private Double score;
        private String rank;
        private String status;
    }
}
