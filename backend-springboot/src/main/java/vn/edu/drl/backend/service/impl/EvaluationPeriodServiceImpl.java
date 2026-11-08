package vn.edu.drl.backend.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.drl.backend.dao.*;
import vn.edu.drl.backend.dto.request.EvaluationPeriodRequest;
import vn.edu.drl.backend.dto.request.ExtendDeadlineRequest;
import vn.edu.drl.backend.dto.response.EvaluationPeriodFormOptionsResponse;
import vn.edu.drl.backend.dto.response.EvaluationPeriodResponse;
import vn.edu.drl.backend.enu.EvaluationPeriodStatus;
import vn.edu.drl.backend.enu.FormVersionStatus;
import vn.edu.drl.backend.enu.NotificationType;
import vn.edu.drl.backend.enu.Role;
import vn.edu.drl.backend.model.*;
import vn.edu.drl.backend.service.EvaluationPeriodService;
import vn.edu.drl.backend.service.NotificationService;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class EvaluationPeriodServiceImpl implements EvaluationPeriodService {

    private final EvaluationPeriodRepository evaluationPeriodRepository;
    private final SemesterRepository semesterRepository;
    private final FormVersionRepository formVersionRepository;
    private final UserRepository userRepository;
    private final AuditLogRepository auditLogRepository;
    private final NotificationService notificationService;

    private static final List<String> STANDARD_SCOPES = List.of(
            "Toàn trường",
            "Khoa Công nghệ Thông tin",
            "Khoa Kỹ thuật Xây dựng",
            "Khóa QH-2023-I/CQ",
            "Khóa QH-2024-I/CQ",
            "Khóa QH-2025-I/CQ"
    );

    @Override
    @Transactional(readOnly = true)
    public List<EvaluationPeriodResponse> searchPeriods(String keyword, Long semesterId, EvaluationPeriodStatus status) {
        String kw = (keyword != null && !keyword.trim().isEmpty())
                ? "%" + keyword.trim().toLowerCase() + "%"
                : null;
        List<EvaluationPeriod> periods = evaluationPeriodRepository.searchPeriods(kw, semesterId, status);
        return periods.stream().map(this::mapToResponseWithoutHistory).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public EvaluationPeriodResponse getPeriodById(Long id) {
        EvaluationPeriod period = evaluationPeriodRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy kỳ chấm ĐRL với ID: " + id));

        EvaluationPeriodResponse resp = mapToResponseWithoutHistory(period);

        // Fetch audit history (UC018 R)
        List<AuditLog> auditLogs = auditLogRepository.findByEvaluationPeriodIdOrderByCreatedAtDesc(id);
        List<EvaluationPeriodResponse.AuditLogItem> history = auditLogs.stream().map(log ->
                EvaluationPeriodResponse.AuditLogItem.builder()
                        .id(log.getId())
                        .actorName(log.getUser() != null ? log.getUser().getFullName() : "Hệ thống")
                        .action(log.getAction())
                        .actionDisplayName(getActionDisplayName(log.getAction()))
                        .fromStatus(log.getFromStatus())
                        .toStatus(log.getToStatus())
                        .note(log.getNote())
                        .createdAt(log.getCreatedAt())
                        .build()
        ).collect(Collectors.toList());

        resp.setHistory(history);
        return resp;
    }

    @Override
    @Transactional
    public EvaluationPeriodResponse createPeriod(Long adminUserId, EvaluationPeriodRequest request) {
        User admin = userRepository.findById(adminUserId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy thông tin quản trị viên"));

        Semester semester = semesterRepository.findById(request.getSemesterId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy học kỳ với ID: " + request.getSemesterId()));

        FormVersion formVersion = formVersionRepository.findById(request.getFormVersionId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phiên bản biểu mẫu với ID: " + request.getFormVersionId()));

        // Check form version must be ACTIVE
        if (formVersion.getStatus() != FormVersionStatus.ACTIVE) {
            throw new RuntimeException("Chỉ được chọn phiên bản biểu mẫu đang có hiệu lực (ACTIVE)");
        }

        // Validate submission deadline
        LocalDate today = LocalDate.now();
        if (request.getSubmissionDeadline().isBefore(today)) {
            throw new RuntimeException("Hạn nộp không hợp lệ: không được trước ngày hiện tại");
        }

        // 6b Duplicate check: cùng Học kỳ và Phạm vi áp dụng đang Chưa mở hoặc Đang mở
        List<EvaluationPeriod> duplicates = evaluationPeriodRepository.findBySemesterIdAndApplicationScopeAndStatusIn(
                request.getSemesterId(),
                request.getApplicationScope().trim(),
                List.of(EvaluationPeriodStatus.CHUA_MO, EvaluationPeriodStatus.DANG_MO)
        );
        if (!duplicates.isEmpty()) {
            throw new RuntimeException("409 CONFLICT: Đã có kỳ cùng Học kỳ và Phạm vi áp dụng đang Chưa mở hoặc Đang mở");
        }

        EvaluationPeriod period = EvaluationPeriod.builder()
                .semester(semester)
                .formVersion(formVersion)
                .applicationScope(request.getApplicationScope().trim())
                .submissionDeadline(request.getSubmissionDeadline())
                .status(EvaluationPeriodStatus.CHUA_MO)
                .createdBy(admin)
                .build();

        EvaluationPeriod saved = evaluationPeriodRepository.save(period);

        // Record audit log
        AuditLog audit = new AuditLog();
        audit.setEvaluationPeriod(saved);
        audit.setUser(admin);
        audit.setAction("CREATE_PERIOD");
        audit.setToStatus(EvaluationPeriodStatus.CHUA_MO.name());
        audit.setNote("Tạo mới kỳ chấm ĐRL (Trạng thái: Chưa mở)");
        auditLogRepository.save(audit);

        return getPeriodById(saved.getId());
    }

    @Override
    @Transactional
    public EvaluationPeriodResponse openPeriod(Long adminUserId, Long id) {
        User admin = userRepository.findById(adminUserId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy quản trị viên"));

        EvaluationPeriod period = evaluationPeriodRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy kỳ chấm ĐRL với ID: " + id));

        if (period.getStatus() == EvaluationPeriodStatus.DANG_MO) {
            throw new RuntimeException("Kỳ chấm ĐRL này hiện đã đang mở");
        }
        if (period.getStatus() == EvaluationPeriodStatus.DA_DONG) {
            throw new RuntimeException("Không thể mở lại kỳ chấm ĐRL đã đóng");
        }

        EvaluationPeriodStatus oldStatus = period.getStatus();
        period.setStatus(EvaluationPeriodStatus.DANG_MO);
        evaluationPeriodRepository.save(period);

        // Also synchronize semester is_active flag
        Semester semester = period.getSemester();
        if (semester != null && !Boolean.TRUE.equals(semester.getIsActive())) {
            semester.setIsActive(true);
            semesterRepository.save(semester);
        }

        // Record audit log
        AuditLog audit = new AuditLog();
        audit.setEvaluationPeriod(period);
        audit.setUser(admin);
        audit.setAction("OPEN_PERIOD");
        audit.setFromStatus(oldStatus.name());
        audit.setToStatus(EvaluationPeriodStatus.DANG_MO.name());
        audit.setNote("Mở kỳ chấm ĐRL cho sinh viên");
        auditLogRepository.save(audit);

        // 8. Send notification to all students
        try {
            String formattedDeadline = period.getSubmissionDeadline().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));
            String title = "Mở kỳ chấm ĐRL " + (semester != null ? semester.getSemesterName() : "");
            String content = "Kỳ chấm ĐRL " + (semester != null ? semester.getSemesterName() : "") +
                    " năm học " + (semester != null ? semester.getAcademicYear() : "") +
                    " đã mở, hạn nộp " + formattedDeadline;

            List<User> students = userRepository.findByRoleIn(List.of(Role.STUDENT, Role.CLASS_LEADER, Role.CLASS_DEPUTY));
            for (User s : students) {
                notificationService.createNotification(
                        s.getId(),
                        title,
                        content,
                        NotificationType.SYSTEM,
                        "/student/compose"
                );
            }
        } catch (Exception e) {
            // 8a: Không có sinh viên nhận được thông báo do lỗi hệ thống: kỳ vẫn Đang mở; lỗi được ghi nhận
            log.error("Lỗi khi gửi thông báo mở kỳ chấm ĐRL tới sinh viên: {}", e.getMessage(), e);
        }

        return getPeriodById(period.getId());
    }

    @Override
    @Transactional
    public EvaluationPeriodResponse extendDeadline(Long adminUserId, Long id, ExtendDeadlineRequest request) {
        User admin = userRepository.findById(adminUserId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy quản trị viên"));

        EvaluationPeriod period = evaluationPeriodRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy kỳ chấm ĐRL với ID: " + id));

        if (period.getStatus() != EvaluationPeriodStatus.DANG_MO) {
            throw new RuntimeException("Chỉ có thể gia hạn khi kỳ chấm đang ở trạng thái Đang mở");
        }

        if (request.getNewDeadline() == null || !request.getNewDeadline().isAfter(period.getSubmissionDeadline())) {
            throw new RuntimeException("Hạn nộp mới phải muộn hơn hạn nộp hiện tại (" +
                    period.getSubmissionDeadline().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) + ")");
        }

        LocalDate oldDeadline = period.getSubmissionDeadline();
        period.setSubmissionDeadline(request.getNewDeadline());
        evaluationPeriodRepository.save(period);

        // Record audit log
        AuditLog audit = new AuditLog();
        audit.setEvaluationPeriod(period);
        audit.setUser(admin);
        audit.setAction("EXTEND_DEADLINE");
        audit.setFromStatus(EvaluationPeriodStatus.DANG_MO.name());
        audit.setToStatus(EvaluationPeriodStatus.DANG_MO.name());
        audit.setNote("Gia hạn hạn nộp từ " +
                oldDeadline.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) +
                " đến " +
                request.getNewDeadline().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")));
        auditLogRepository.save(audit);

        return getPeriodById(period.getId());
    }

    @Override
    @Transactional
    public EvaluationPeriodResponse closePeriod(Long adminUserId, Long id) {
        User admin = userRepository.findById(adminUserId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy quản trị viên"));

        EvaluationPeriod period = evaluationPeriodRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy kỳ chấm ĐRL với ID: " + id));

        if (period.getStatus() != EvaluationPeriodStatus.DANG_MO) {
            throw new RuntimeException("Chỉ có thể đóng kỳ chấm khi kỳ đang ở trạng thái Đang mở");
        }

        EvaluationPeriodStatus oldStatus = period.getStatus();
        period.setStatus(EvaluationPeriodStatus.DA_DONG);
        evaluationPeriodRepository.save(period);

        // Record audit log
        AuditLog audit = new AuditLog();
        audit.setEvaluationPeriod(period);
        audit.setUser(admin);
        audit.setAction("CLOSE_PERIOD");
        audit.setFromStatus(oldStatus.name());
        audit.setToStatus(EvaluationPeriodStatus.DA_DONG.name());
        audit.setNote("Đóng kỳ chấm ĐRL sớm bởi Quản trị viên");
        auditLogRepository.save(audit);

        return getPeriodById(period.getId());
    }

    @Override
    @Transactional(readOnly = true)
    public EvaluationPeriodFormOptionsResponse getFormOptions() {
        List<Semester> semesters = semesterRepository.findAll();
        List<EvaluationPeriodFormOptionsResponse.SemesterOption> semOptions = semesters.stream().map(s ->
                EvaluationPeriodFormOptionsResponse.SemesterOption.builder()
                        .id(s.getId())
                        .semesterCode(s.getSemesterCode())
                        .semesterName(s.getSemesterName())
                        .academicYear(s.getAcademicYear())
                        .isActive(s.getIsActive())
                        .build()
        ).collect(Collectors.toList());

        List<FormVersion> formVersions = formVersionRepository.findAll();
        List<EvaluationPeriodFormOptionsResponse.FormVersionOption> fvOptions = formVersions.stream()
                .filter(f -> f.getStatus() == FormVersionStatus.ACTIVE)
                .map(f ->
                        EvaluationPeriodFormOptionsResponse.FormVersionOption.builder()
                                .id(f.getId())
                                .semesterId(f.getSemester() != null ? f.getSemester().getId() : null)
                                .formCode(f.getFormCode())
                                .formName(f.getFormName())
                                .versionNo(f.getVersionNo())
                                .status(f.getStatus().name())
                                .build()
                ).collect(Collectors.toList());

        return EvaluationPeriodFormOptionsResponse.builder()
                .semesters(semOptions)
                .formVersions(fvOptions)
                .scopes(STANDARD_SCOPES)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public EvaluationPeriodResponse getActivePeriod() {
        return evaluationPeriodRepository.findFirstByStatusOrderByCreatedAtDesc(EvaluationPeriodStatus.DANG_MO)
                .map(this::mapToResponseWithoutHistory)
                .orElse(null);
    }

    private EvaluationPeriodResponse mapToResponseWithoutHistory(EvaluationPeriod p) {
        LocalDate today = LocalDate.now();
        long remaining = (p.getSubmissionDeadline() != null)
                ? Math.max(0, ChronoUnit.DAYS.between(today, p.getSubmissionDeadline()))
                : 0;

        return EvaluationPeriodResponse.builder()
                .id(p.getId())
                .semesterId(p.getSemester() != null ? p.getSemester().getId() : null)
                .semesterCode(p.getSemester() != null ? p.getSemester().getSemesterCode() : null)
                .semesterName(p.getSemester() != null ? p.getSemester().getSemesterName() : null)
                .academicYear(p.getSemester() != null ? p.getSemester().getAcademicYear() : null)
                .formVersionId(p.getFormVersion() != null ? p.getFormVersion().getId() : null)
                .formCode(p.getFormVersion() != null ? p.getFormVersion().getFormCode() : null)
                .formVersionNo(p.getFormVersion() != null ? p.getFormVersion().getVersionNo() : null)
                .formName(p.getFormVersion() != null ? p.getFormVersion().getFormName() : null)
                .applicationScope(p.getApplicationScope())
                .submissionDeadline(p.getSubmissionDeadline())
                .status(p.getStatus())
                .statusDisplayName(p.getStatus() != null ? p.getStatus().getDisplayName() : "")
                .remainingDays(remaining)
                .createdByName(p.getCreatedBy() != null ? p.getCreatedBy().getFullName() : null)
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .build();
    }

    private String getActionDisplayName(String action) {
        if (action == null) return "Cập nhật";
        return switch (action) {
            case "CREATE_PERIOD" -> "Tạo mới kỳ chấm";
            case "OPEN_PERIOD" -> "Mở kỳ chấm";
            case "EXTEND_DEADLINE" -> "Gia hạn hạn nộp";
            case "CLOSE_PERIOD" -> "Đóng kỳ chấm";
            default -> action;
        };
    }
}
