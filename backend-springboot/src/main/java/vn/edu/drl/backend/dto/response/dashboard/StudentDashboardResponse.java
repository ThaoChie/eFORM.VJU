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
public class StudentDashboardResponse {
    private String studentName;
    private boolean hasSignature;
    private boolean isLeader;
    private long pendingLeaderReviews;
    private boolean canCompose;
    private String periodNotice;
    private SemesterInfoDto semester;
    private String formVersion;
    private MyFormDto myForm;
    private List<NotificationDto> notifications;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SemesterInfoDto {
        private Long id;
        private Long periodId;
        private String periodStatus; // "DANG_MO", "CHUA_MO", "DA_DONG", "VO_HIEU_HOA"
        private String name;
        private String academicYear;
        private String deadline;
        private long remainingDays;
        private boolean isExpired;
        private boolean isLocked;
        private String notice;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MyFormDto {
        private Long formId;
        private String status; // "Soạn thảo", "Chờ lớp duyệt", "Chờ khoa duyệt", "Hoàn tất", "Đã chuyển trả"
        private int currentStep; // 0, 1, 2, 3
        private Double score;
        private String ranking;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class NotificationDto {
        private Long id;
        private String title;
        private String content;
        private String text;
        private String time;
        private String linkUrl;
        private boolean read;
    }
}
