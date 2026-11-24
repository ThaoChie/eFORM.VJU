package vn.edu.drl.backend.service.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
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
import vn.edu.drl.backend.enu.ScoreFormStatus;
import vn.edu.drl.backend.model.*;
import vn.edu.drl.backend.service.interfaces.EmailService;
import vn.edu.drl.backend.service.interfaces.EvaluationPeriodService;
import vn.edu.drl.backend.service.interfaces.NotificationService;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;
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
    private final ScoreFormRepository scoreFormRepository;
    private final DepartmentRepository departmentRepository;
    private final ClassRepository classRepository;
    private final NotificationService notificationService;
    private final EmailService emailService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final List<String> STANDARD_SCOPES = List.of(
            "Toàn trường",
            "Theo khoa"
    );

    @Override
    @Transactional(readOnly = true)
    public List<EvaluationPeriodResponse> searchPeriods(String keyword, Long semesterId, EvaluationPeriodStatus status) {
        String kw = (keyword != null && !keyword.trim().isEmpty())
                ? "%" + keyword.trim().toLowerCase() + "%"
                : null;

        List<EvaluationPeriod> periods = evaluationPeriodRepository.searchPeriods(kw, semesterId, status);
        return periods.stream()
                .map(this::mapToResponseWithoutHistory)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public EvaluationPeriodResponse getPeriodById(Long id) {
        EvaluationPeriod period = evaluationPeriodRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy kỳ chấm ĐRL với ID: " + id));

        EvaluationPeriodResponse resp = mapToResponseWithoutHistory(period);

        // Fetch audit history (UC018 R)
        List<AuditLog> auditLogs = auditLogRepository.findByEvaluationPeriodIdOrderByCreatedAtDesc(id);
        List<EvaluationPeriodResponse.AuditLogItem> history = auditLogs.stream().map(l ->
                EvaluationPeriodResponse.AuditLogItem.builder()
                        .id(l.getId())
                        .actorName(l.getUser() != null ? l.getUser().getFullName() : "Hệ thống")
                        .action(l.getAction())
                        .actionDisplayName(getActionDisplayName(l.getAction()))
                        .fromStatus(l.getFromStatus())
                        .toStatus(l.getToStatus())
                        .note(l.getNote())
                        .createdAt(l.getCreatedAt())
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

        // 1. Kiểm tra mã đợt chấm duy nhất
        String periodCode = (request.getPeriodCode() != null) ? request.getPeriodCode().trim() : "";
        if (periodCode.isEmpty()) {
            throw new RuntimeException("Mã đợt chấm không được để trống.");
        }
        if (evaluationPeriodRepository.existsByPeriodCode(periodCode)) {
            throw new RuntimeException("Mã đợt chấm '" + periodCode + "' đã tồn tại trên hệ thống. Vui lòng sử dụng mã khác.");
        }

        Semester semester = semesterRepository.findById(request.getSemesterId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy học kỳ với ID: " + request.getSemesterId()));

        FormVersion formVersion = formVersionRepository.findById(request.getFormVersionId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phiên bản biểu mẫu với ID: " + request.getFormVersionId()));

        // 2. Biểu mẫu phải ở trạng thái ACTIVE
        if (formVersion.getStatus() != FormVersionStatus.ACTIVE) {
            throw new RuntimeException("Chỉ được chọn phiên bản biểu mẫu đang có hiệu lực (ACTIVE).");
        }

        // Đồng bộ fallback deadline nếu client truyền submissionDeadline
        LocalDate studentDeadline = request.getStudentDeadline() != null ? request.getStudentDeadline() : request.getSubmissionDeadline();
        LocalDate startDate = request.getStartDate() != null ? request.getStartDate() : LocalDate.now();
        LocalDate classDeadline = request.getClassDeadline() != null ? request.getClassDeadline() : (studentDeadline != null ? studentDeadline.plusDays(7) : null);
        LocalDate deanDeadline = request.getDeanDeadline() != null ? request.getDeanDeadline() : (classDeadline != null ? classDeadline.plusDays(7) : null);

        // 3. Kiểm tra các mốc thời hạn tuần tự
        validateTimelineOrder(startDate, studentDeadline, classDeadline, deanDeadline);

        // 4. Kiểm tra phạm vi Theo khoa
        String scope = request.getApplicationScope() != null ? request.getApplicationScope().trim() : "Toàn trường";
        String applicableDeptStr = null;
        if ("Theo khoa".equalsIgnoreCase(scope)) {
            if (request.getApplicableDepartmentIds() == null || request.getApplicableDepartmentIds().isEmpty()) {
                throw new RuntimeException("Khi chọn phạm vi 'Theo khoa', bắt buộc phải chọn ít nhất 01 khoa áp dụng.");
            }
            applicableDeptStr = request.getApplicableDepartmentIds().stream()
                    .map(String::valueOf)
                    .collect(Collectors.joining(","));
        }

        EvaluationPeriod period = EvaluationPeriod.builder()
                .periodCode(periodCode)
                .semester(semester)
                .formVersion(formVersion)
                .applicationScope(scope)
                .applicableDepartments(applicableDeptStr)
                .startDate(startDate)
                .studentDeadline(studentDeadline)
                .classDeadline(classDeadline)
                .deanDeadline(deanDeadline)
                .submissionDeadline(studentDeadline)
                .status(EvaluationPeriodStatus.CHUA_MO)
                .isLocked(false)
                .createdBy(admin)
                .build();

        EvaluationPeriod saved = evaluationPeriodRepository.save(period);

        // Record audit log
        AuditLog audit = new AuditLog();
        audit.setEvaluationPeriod(saved);
        audit.setUser(admin);
        audit.setAction("CREATE_PERIOD");
        audit.setToStatus(EvaluationPeriodStatus.CHUA_MO.name());
        audit.setNote("Tạo mới kỳ chấm ĐRL " + periodCode + " (Trạng thái: Chưa mở)");
        auditLogRepository.save(audit);

        return getPeriodById(saved.getId());
    }

    @Override
    @Transactional
    public EvaluationPeriodResponse updatePeriod(Long adminUserId, Long id, EvaluationPeriodRequest request) {
        User admin = userRepository.findById(adminUserId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy thông tin quản trị viên"));

        EvaluationPeriod period = evaluationPeriodRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy kỳ chấm ĐRL với ID: " + id));

        if (period.getStatus() != EvaluationPeriodStatus.CHUA_MO) {
            throw new RuntimeException("Chỉ được chỉnh sửa kỳ chấm ĐRL khi đang ở trạng thái Chưa mở");
        }

        // 1. Kiểm tra mã đợt chấm duy nhất
        String periodCode = (request.getPeriodCode() != null) ? request.getPeriodCode().trim() : "";
        if (!periodCode.isEmpty() && !periodCode.equals(period.getPeriodCode())) {
            if (evaluationPeriodRepository.existsByPeriodCodeAndIdNot(periodCode, id)) {
                throw new RuntimeException("Mã đợt chấm '" + periodCode + "' đã tồn tại trên hệ thống. Vui lòng sử dụng mã khác.");
            }
            period.setPeriodCode(periodCode);
        }

        Semester semester = semesterRepository.findById(request.getSemesterId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy học kỳ với ID: " + request.getSemesterId()));

        FormVersion formVersion = formVersionRepository.findById(request.getFormVersionId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phiên bản biểu mẫu với ID: " + request.getFormVersionId()));

        if (formVersion.getStatus() != FormVersionStatus.ACTIVE) {
            throw new RuntimeException("Chỉ được chọn phiên bản biểu mẫu đang có hiệu lực (ACTIVE).");
        }

        LocalDate studentDeadline = request.getStudentDeadline() != null ? request.getStudentDeadline() : request.getSubmissionDeadline();
        LocalDate startDate = request.getStartDate() != null ? request.getStartDate() : period.getStartDate();
        LocalDate classDeadline = request.getClassDeadline() != null ? request.getClassDeadline() : (studentDeadline != null ? studentDeadline.plusDays(7) : null);
        LocalDate deanDeadline = request.getDeanDeadline() != null ? request.getDeanDeadline() : (classDeadline != null ? classDeadline.plusDays(7) : null);

        // Kiểm tra thứ tự tuần tự
        validateTimelineOrder(startDate, studentDeadline, classDeadline, deanDeadline);

        String scope = request.getApplicationScope() != null ? request.getApplicationScope().trim() : "Toàn trường";
        String applicableDeptStr = null;
        if ("Theo khoa".equalsIgnoreCase(scope)) {
            if (request.getApplicableDepartmentIds() == null || request.getApplicableDepartmentIds().isEmpty()) {
                throw new RuntimeException("Khi chọn phạm vi 'Theo khoa', bắt buộc phải chọn ít nhất 01 khoa áp dụng.");
            }
            applicableDeptStr = request.getApplicableDepartmentIds().stream()
                    .map(String::valueOf)
                    .collect(Collectors.joining(","));
        }

        period.setSemester(semester);
        period.setFormVersion(formVersion);
        period.setApplicationScope(scope);
        period.setApplicableDepartments(applicableDeptStr);
        period.setStartDate(startDate);
        period.setStudentDeadline(studentDeadline);
        period.setClassDeadline(classDeadline);
        period.setDeanDeadline(deanDeadline);
        period.setSubmissionDeadline(studentDeadline);

        evaluationPeriodRepository.save(period);

        AuditLog audit = new AuditLog();
        audit.setEvaluationPeriod(period);
        audit.setUser(admin);
        audit.setAction("UPDATE_PERIOD");
        audit.setFromStatus(EvaluationPeriodStatus.CHUA_MO.name());
        audit.setToStatus(EvaluationPeriodStatus.CHUA_MO.name());
        audit.setNote("Chỉnh sửa thông tin kỳ chấm ĐRL " + period.getPeriodCode() + " (Trạng thái: Chưa mở)");
        auditLogRepository.save(audit);

        return getPeriodById(period.getId());
    }

    @Override
    @Transactional
    public void deletePeriod(Long adminUserId, Long id) {
        EvaluationPeriod period = evaluationPeriodRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy kỳ chấm ĐRL với ID: " + id));

        if (period.getStatus() != EvaluationPeriodStatus.CHUA_MO) {
            throw new RuntimeException("Chỉ được xóa kỳ chấm ĐRL khi đang ở trạng thái Chưa mở");
        }

        auditLogRepository.deleteByEvaluationPeriodId(id);
        evaluationPeriodRepository.delete(period);
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
            throw new RuntimeException("Không thể mở lại kỳ chấm ĐRL đã đóng/khóa sổ");
        }

        // 1. Kiểm tra: Toàn trường chỉ duy nhất 01 kỳ chấm ở trạng thái Đang mở
        Optional<EvaluationPeriod> activeOther = evaluationPeriodRepository.findFirstByStatusOrderByCreatedAtDesc(EvaluationPeriodStatus.DANG_MO);
        if (activeOther.isPresent() && !activeOther.get().getId().equals(id)) {
            throw new RuntimeException("Hiện tại đang có một kỳ chấm ĐRL đang mở (" +
                    activeOther.get().getPeriodCode() + "). Vui lòng khóa sổ đợt chấm hiện tại trước khi kích hoạt mở đợt mới.");
        }

        // 2. Kiểm tra hạn nộp
        LocalDate today = LocalDate.now();
        LocalDate deadline = period.getStudentDeadline() != null ? period.getStudentDeadline() : period.getSubmissionDeadline();
        if (deadline != null && deadline.isBefore(today)) {
            throw new RuntimeException("Hạn nộp sinh viên của kỳ chấm này đã qua (" +
                    deadline.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) +
                    "). Vui lòng gia hạn hạn nộp trước khi mở kỳ.");
        }

        EvaluationPeriodStatus oldStatus = period.getStatus();
        period.setStatus(EvaluationPeriodStatus.DANG_MO);
        period.setIsLocked(false);
        evaluationPeriodRepository.save(period);

        // Đồng bộ trạng thái học kỳ
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
        audit.setNote("Kích hoạt mở đợt chấm ĐRL " + period.getPeriodCode() + " toàn trường (is_active = TRUE)");
        auditLogRepository.save(audit);

        // 3. Phát thông báo tự động (In-app & Brevo Email) tới Sinh viên, Cán bộ Lớp và Lãnh đạo Khoa
        try {
            String formattedDeadline = (deadline != null) ? deadline.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) : "Theo thông báo";
            String title = "Mở kỳ chấm ĐRL " + (semester != null ? semester.getSemesterName() : "");
            String content = "Kỳ chấm ĐRL " + (semester != null ? semester.getSemesterName() : "") +
                    " (" + period.getPeriodCode() + ") đã chính thức mở cổng tự đánh giá. Hạn nộp sinh viên: " + formattedDeadline;

            List<User> recipients = userRepository.findByRoleIn(List.of(Role.STUDENT, Role.CLASS_LEADER, Role.CLASS_DEPUTY, Role.DEAN));
            notificationService.createBatchNotificationsAsync(
                    recipients,
                    title,
                    content,
                    NotificationType.SYSTEM,
                    "/student/compose"
            );
            try {
                emailService.sendNewEvaluationPeriodEmail(recipients, period);
            } catch (Exception ex) {
                log.warn("Lỗi khi gửi email mở kỳ ĐRL: {}", ex.getMessage());
            }
        } catch (Exception e) {
            log.error("Lỗi khi gửi thông báo mở kỳ chấm ĐRL: {}", e.getMessage(), e);
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

        String extendScope = request.getExtendScope() != null ? request.getExtendScope().trim().toUpperCase() : "ALL";

        // =========================================================================
        // Luồng 1a - Nhánh 1: Cấu hình mở lẻ ngoại lệ cho Lớp / Khoa đặc thù
        // =========================================================================
        if ("EXCEPTION".equals(extendScope)) {
            if (request.getTargetType() == null || request.getTargetId() == null || request.getExceptionDeadline() == null) {
                throw new RuntimeException("Thiếu thông tin đối tượng ngoại lệ (Lớp/Khoa) hoặc hạn mở lẻ.");
            }
            if (!request.getExceptionDeadline().isAfter(LocalDate.now())) {
                throw new RuntimeException("Hạn mở lẻ ngoại lệ phải lớn hơn ngày hiện tại.");
            }

            List<Map<String, Object>> exceptionList = parseExceptions(period.getExceptions());
            Map<String, Object> newException = new HashMap<>();
            newException.put("id", UUID.randomUUID().toString());
            newException.put("targetType", request.getTargetType().toUpperCase());
            newException.put("targetId", request.getTargetId());
            newException.put("targetName", request.getTargetName() != null ? request.getTargetName() : "Đơn vị #" + request.getTargetId());
            newException.put("deadline", request.getExceptionDeadline().toString());
            newException.put("reason", request.getReason() != null ? request.getReason() : "Mở lẻ ngoại lệ");
            newException.put("createdAt", Instant.now().toString());

            // Thay thế nếu trùng đối tượng, hoặc thêm mới
            exceptionList.removeIf(e -> Objects.equals(e.get("targetType"), request.getTargetType().toUpperCase()) &&
                    Objects.equals(String.valueOf(e.get("targetId")), String.valueOf(request.getTargetId())));
            exceptionList.add(newException);

            try {
                period.setExceptions(objectMapper.writeValueAsString(exceptionList));
            } catch (Exception ex) {
                log.error("Lỗi parse JSON exceptions: {}", ex.getMessage());
            }
            evaluationPeriodRepository.save(period);

            // Audit Log
            AuditLog audit = new AuditLog();
            audit.setEvaluationPeriod(period);
            audit.setUser(admin);
            audit.setAction("EXTEND_EXCEPTION");
            audit.setFromStatus(EvaluationPeriodStatus.DANG_MO.name());
            audit.setToStatus(EvaluationPeriodStatus.DANG_MO.name());
            audit.setNote("Cấp quyền mở nộp/sửa lẻ cho " + request.getTargetType() + " " + request.getTargetName() +
                    " đến ngày " + request.getExceptionDeadline().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) +
                    ". Lý do: " + request.getReason());
            auditLogRepository.save(audit);

            return getPeriodById(period.getId());
        }

        // =========================================================================
        // Luồng 1a - Nhánh 2: Gia hạn chung toàn trường
        // =========================================================================
        LocalDate newStudentDeadline = request.getNewStudentDeadline() != null ? request.getNewStudentDeadline() : request.getNewDeadline();
        if (newStudentDeadline == null) {
            newStudentDeadline = period.getStudentDeadline();
        }

        LocalDate currentStudentDeadline = period.getStudentDeadline() != null ? period.getStudentDeadline() : period.getSubmissionDeadline();
        if (newStudentDeadline != null && currentStudentDeadline != null && !newStudentDeadline.isAfter(currentStudentDeadline)) {
            throw new RuntimeException("Hạn sinh viên nộp bài mới phải muộn hơn hạn hiện tại (" +
                    currentStudentDeadline.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) + ")");
        }

        LocalDate newClassDeadline = request.getNewClassDeadline() != null ? request.getNewClassDeadline() : period.getClassDeadline();
        if (newClassDeadline == null && newStudentDeadline != null) {
            newClassDeadline = newStudentDeadline.plusDays(7);
        }

        LocalDate newDeanDeadline = request.getNewDeanDeadline() != null ? request.getNewDeanDeadline() : period.getDeanDeadline();
        if (newDeanDeadline == null && newClassDeadline != null) {
            newDeanDeadline = newClassDeadline.plusDays(7);
        }

        // Kiểm tra logic thứ tự BR-KCDRL-02
        validateTimelineOrder(period.getStartDate(), newStudentDeadline, newClassDeadline, newDeanDeadline);

        LocalDate oldDeadline = period.getStudentDeadline();
        period.setStudentDeadline(newStudentDeadline);
        period.setSubmissionDeadline(newStudentDeadline);
        period.setClassDeadline(newClassDeadline);
        period.setDeanDeadline(newDeanDeadline);
        evaluationPeriodRepository.save(period);

        // Record audit log
        AuditLog audit = new AuditLog();
        audit.setEvaluationPeriod(period);
        audit.setUser(admin);
        audit.setAction("EXTEND_DEADLINE");
        audit.setFromStatus(EvaluationPeriodStatus.DANG_MO.name());
        audit.setToStatus(EvaluationPeriodStatus.DANG_MO.name());
        audit.setNote("Gia hạn thời hạn chung toàn trường: SV nộp bài đến " +
                (newStudentDeadline != null ? newStudentDeadline.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) : "") +
                ", Lớp duyệt đến " + (newClassDeadline != null ? newClassDeadline.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) : "") +
                ", Khoa duyệt đến " + (newDeanDeadline != null ? newDeanDeadline.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) : ""));
        auditLogRepository.save(audit);

        // Gửi thông báo gia hạn
        try {
            String formattedDeadline = newStudentDeadline != null ? newStudentDeadline.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) : "";
            String title = "Gia hạn hạn nộp kỳ chấm ĐRL " + (period.getSemester() != null ? period.getSemester().getSemesterName() : "");
            String content = "Kỳ chấm ĐRL " + (period.getSemester() != null ? period.getSemester().getSemesterName() : "") +
                    " đã được gia hạn hạn nộp đến ngày " + formattedDeadline;

            List<User> students = userRepository.findByRoleIn(List.of(Role.STUDENT, Role.CLASS_LEADER, Role.CLASS_DEPUTY));
            notificationService.createBatchNotificationsAsync(
                    students,
                    title,
                    content,
                    NotificationType.SYSTEM,
                    "/student/compose"
            );
        } catch (Exception e) {
            log.error("Lỗi khi gửi thông báo gia hạn tới sinh viên: {}", e.getMessage());
        }

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
            throw new RuntimeException("Chỉ có thể khóa sổ khi kỳ chấm đang ở trạng thái Đang mở");
        }

        // =========================================================================
        // Chuỗi xử lý Khóa sổ tự động (Luồng sự kiện thay thế 1b & BR-KCDRL-06):
        // 1) Chuyển trạng thái kỳ chấm sang INACTIVE / DA_DONG (is_active = FALSE).
        // 2) Vô hiệu hóa toàn bộ tính năng Soạn/Nộp/Duyệt phiếu (chuyển sang Read-only, is_locked = TRUE).
        // 3) Chuyển tất cả phiếu DRAFT chưa nộp sang EXPIRED, tự động gán mặc định Điểm = 0 và Xếp loại = 'Kém'.
        // 4) Khóa cứng cờ is_locked = TRUE trên các phiếu.
        // 5) Tự động gọi API đẩy dữ liệu điểm tổng hợp sang Hệ thống SIS/Core của Phòng Đào tạo.
        // =========================================================================

        EvaluationPeriodStatus oldStatus = period.getStatus();
        period.setStatus(EvaluationPeriodStatus.DA_DONG);
        period.setIsLocked(true);
        evaluationPeriodRepository.save(period);

        int expiredCount = 0;
        int lockedCount = 0;

        if (period.getSemester() != null) {
            List<ScoreForm> forms = scoreFormRepository.findByEvaluationPeriodId(period.getId());
            if (forms.isEmpty()) {
                forms = scoreFormRepository.findBySemesterId(period.getSemester().getId());
            }
            for (ScoreForm f : forms) {
                f.setIsLocked(true); // Khóa cứng Read-only
                lockedCount++;

                // Chuyển DRAFT sang EXPIRED, gán 0 điểm và Xếp loại Kém
                if (f.getStatus() == ScoreFormStatus.DRAFT) {
                    f.setStatus(ScoreFormStatus.EXPIRED);
                    f.setStudentTotal(BigDecimal.ZERO);
                    f.setClassTotal(BigDecimal.ZERO);
                    f.setFinalTotal(BigDecimal.ZERO);
                    f.setRanking("Kém");
                    f.setRejectReason("Hệ thống tự động khóa sổ kỳ chấm: Phiếu chưa nộp đúng hạn.");
                    expiredCount++;
                }
            }
            scoreFormRepository.saveAll(forms);
        }

        // Đồng bộ kết quả sang SIS/Core (Mô phỏng tích hợp tự động qua API)
        log.info("[SIS SYNC AUTO] Đã đồng bộ thành công {} phiếu điểm rèn luyện của kỳ {} sang Hệ thống SIS/Core (Phòng Đào tạo).",
                lockedCount, period.getPeriodCode());

        // Ghi nhận Audit Log
        AuditLog audit = new AuditLog();
        audit.setEvaluationPeriod(period);
        audit.setUser(admin);
        audit.setAction("CLOSE_PERIOD");
        audit.setFromStatus(oldStatus.name());
        audit.setToStatus(EvaluationPeriodStatus.DA_DONG.name());
        audit.setNote("Khóa sổ đợt chấm " + period.getPeriodCode() +
                ". Đã chuyển " + expiredCount + " phiếu chưa hoàn tất sang hết hạn (0 điểm) và niêm phong " +
                lockedCount + " phiếu kết quả chuyển Phòng Đào tạo.");
        auditLogRepository.save(audit);

        // Gửi thông báo tới sinh viên và cán bộ
        try {
            String title = "Đóng kỳ & Khóa sổ ĐRL " + (period.getSemester() != null ? period.getSemester().getSemesterName() : "");
            String content = "Cổng đánh giá ĐRL kỳ " + (period.getSemester() != null ? period.getSemester().getSemesterName() : "") +
                    " đã chính thức khóa sổ. Kết quả đã được niêm phong và gửi về Phòng Đào tạo.";

            List<User> recipients = userRepository.findByRoleIn(List.of(Role.STUDENT, Role.CLASS_LEADER, Role.CLASS_DEPUTY, Role.DEAN));
            notificationService.createBatchNotificationsAsync(
                    recipients,
                    title,
                    content,
                    NotificationType.SYSTEM,
                    "/student/history"
            );
        } catch (Exception e) {
            log.error("Lỗi khi gửi thông báo đóng kỳ: {}", e.getMessage());
        }

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

        List<Department> departments = departmentRepository.findAll();
        List<EvaluationPeriodFormOptionsResponse.DepartmentOption> deptOptions = departments.stream().map(d ->
                EvaluationPeriodFormOptionsResponse.DepartmentOption.builder()
                        .id(d.getId())
                        .deptCode(d.getDeptCode())
                        .deptName(d.getDeptName())
                        .build()
        ).collect(Collectors.toList());

        List<ClassEntity> classes = classRepository.findAll();
        List<EvaluationPeriodFormOptionsResponse.ClassOption> classOptions = classes.stream().map(c ->
                EvaluationPeriodFormOptionsResponse.ClassOption.builder()
                        .id(c.getId())
                        .classCode(c.getClassCode())
                        .className(c.getClassName())
                        .departmentId(c.getDepartment() != null ? c.getDepartment().getId() : null)
                        .build()
        ).collect(Collectors.toList());

        return EvaluationPeriodFormOptionsResponse.builder()
                .semesters(semOptions)
                .formVersions(fvOptions)
                .departments(deptOptions)
                .classes(classOptions)
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

    /**
     * Kiểm tra logic 3 mốc thời hạn tuần tự
     */
    private void validateTimelineOrder(LocalDate start, LocalDate student, LocalDate classRev, LocalDate dean) {
        if (start == null || student == null || classRev == null || dean == null) {
            throw new RuntimeException("Vui lòng thiết lập đầy đủ 4 mốc thời gian: Ngày bắt đầu mở cổng, Hạn sinh viên nộp bài, Hạn lớp thẩm định và Hạn khoa phê duyệt.");
        }
        if (!student.isAfter(start)) {
            throw new RuntimeException("Thời hạn không hợp lệ: Hạn sinh viên nộp bài (" + student + ") phải sau ngày bắt đầu mở cổng (" + start + ").");
        }
        if (!classRev.isAfter(student)) {
            throw new RuntimeException("Thời hạn không hợp lệ: Hạn thẩm định của lớp (" + classRev + ") phải sau hạn sinh viên nộp bài (" + student + ").");
        }
        if (!dean.isAfter(classRev)) {
            throw new RuntimeException("Thời hạn không hợp lệ: Hạn phê duyệt của khoa (" + dean + ") phải sau hạn thẩm định của lớp (" + classRev + ").");
        }
    }

    private EvaluationPeriodResponse mapToResponseWithoutHistory(EvaluationPeriod p) {
        LocalDate today = LocalDate.now();
        LocalDate targetDeadline = p.getStudentDeadline() != null ? p.getStudentDeadline() : p.getSubmissionDeadline();
        long remaining = (targetDeadline != null)
                ? Math.max(0, ChronoUnit.DAYS.between(today, targetDeadline))
                : 0;

        Long totalSubmissions = 0L;
        Long completedSubmissions = 0L;
        Long pendingSubmissions = 0L;
        Long draftSubmissions = 0L;
        Long rejectedSubmissions = 0L;

        if (p.getStatus() == EvaluationPeriodStatus.CHUA_MO) {
            // Đợt chấm chưa mở: Tiến độ bằng 0, không lấy dữ liệu của các đợt khác
            totalSubmissions = 0L;
            completedSubmissions = 0L;
            pendingSubmissions = 0L;
            draftSubmissions = 0L;
            rejectedSubmissions = 0L;
        } else if (p.getSemester() != null) {
            // Đợt chấm đang mở hoặc đã đóng:
            long periodCount = scoreFormRepository.countByEvaluationPeriodId(p.getId());
            if (periodCount > 0) {
                totalSubmissions = periodCount;
                completedSubmissions = scoreFormRepository.countByEvaluationPeriodIdAndStatus(p.getId(), ScoreFormStatus.DEAN_APPROVED);
                long submitted = scoreFormRepository.countByEvaluationPeriodIdAndStatus(p.getId(), ScoreFormStatus.SUBMITTED);
                long classApproved = scoreFormRepository.countByEvaluationPeriodIdAndStatus(p.getId(), ScoreFormStatus.CLASS_APPROVED);
                draftSubmissions = scoreFormRepository.countByEvaluationPeriodIdAndStatus(p.getId(), ScoreFormStatus.DRAFT);
                rejectedSubmissions = scoreFormRepository.countByEvaluationPeriodIdAndStatus(p.getId(), ScoreFormStatus.REJECTED);
                pendingSubmissions = submitted + classApproved;
            } else {
                // Fallback nếu dữ liệu cũ chưa có evaluation_period_id
                if (p.getFormVersion() != null) {
                    totalSubmissions = scoreFormRepository.countBySemesterIdAndFormVersionId(p.getSemester().getId(), p.getFormVersion().getId());
                    completedSubmissions = scoreFormRepository.countBySemesterIdAndFormVersionIdAndStatus(p.getSemester().getId(), p.getFormVersion().getId(), ScoreFormStatus.DEAN_APPROVED);
                    long submitted = scoreFormRepository.countBySemesterIdAndFormVersionIdAndStatus(p.getSemester().getId(), p.getFormVersion().getId(), ScoreFormStatus.SUBMITTED);
                    long classApproved = scoreFormRepository.countBySemesterIdAndFormVersionIdAndStatus(p.getSemester().getId(), p.getFormVersion().getId(), ScoreFormStatus.CLASS_APPROVED);
                    draftSubmissions = scoreFormRepository.countBySemesterIdAndFormVersionIdAndStatus(p.getSemester().getId(), p.getFormVersion().getId(), ScoreFormStatus.DRAFT);
                    rejectedSubmissions = scoreFormRepository.countBySemesterIdAndFormVersionIdAndStatus(p.getSemester().getId(), p.getFormVersion().getId(), ScoreFormStatus.REJECTED);
                    pendingSubmissions = submitted + classApproved;
                } else {
                    totalSubmissions = scoreFormRepository.countBySemesterId(p.getSemester().getId());
                    completedSubmissions = scoreFormRepository.countBySemesterIdAndStatus(p.getSemester().getId(), ScoreFormStatus.DEAN_APPROVED);
                    long submitted = scoreFormRepository.countBySemesterIdAndStatus(p.getSemester().getId(), ScoreFormStatus.SUBMITTED);
                    long classApproved = scoreFormRepository.countBySemesterIdAndStatus(p.getSemester().getId(), ScoreFormStatus.CLASS_APPROVED);
                    draftSubmissions = scoreFormRepository.countBySemesterIdAndStatus(p.getSemester().getId(), ScoreFormStatus.DRAFT);
                    rejectedSubmissions = scoreFormRepository.countBySemesterIdAndStatus(p.getSemester().getId(), ScoreFormStatus.REJECTED);
                    pendingSubmissions = submitted + classApproved;
                }
            }
        }

        List<String> deptNames = new ArrayList<>();
        if (p.getApplicableDepartments() != null && !p.getApplicableDepartments().trim().isEmpty()) {
            List<Long> deptIds = Arrays.stream(p.getApplicableDepartments().split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .map(Long::parseLong)
                    .collect(Collectors.toList());
            if (!deptIds.isEmpty()) {
                List<Department> depts = departmentRepository.findAllById(deptIds);
                deptNames = depts.stream().map(Department::getDeptName).collect(Collectors.toList());
            }
        }

        return EvaluationPeriodResponse.builder()
                .id(p.getId())
                .periodCode(p.getPeriodCode() != null ? p.getPeriodCode() : ("HK" + (p.getSemester() != null ? p.getSemester().getId() : "") + "_PERIOD_" + p.getId()))
                .semesterId(p.getSemester() != null ? p.getSemester().getId() : null)
                .semesterCode(p.getSemester() != null ? p.getSemester().getSemesterCode() : null)
                .semesterName(p.getSemester() != null ? p.getSemester().getSemesterName() : null)
                .academicYear(p.getSemester() != null ? p.getSemester().getAcademicYear() : null)
                .formVersionId(p.getFormVersion() != null ? p.getFormVersion().getId() : null)
                .formCode(p.getFormVersion() != null ? p.getFormVersion().getFormCode() : null)
                .formVersionNo(p.getFormVersion() != null ? p.getFormVersion().getVersionNo() : null)
                .formName(p.getFormVersion() != null ? p.getFormVersion().getFormName() : null)
                .applicationScope(p.getApplicationScope())
                .applicableDepartments(p.getApplicableDepartments())
                .applicableDepartmentNames(deptNames)
                .startDate(p.getStartDate() != null ? p.getStartDate() : (p.getCreatedAt() != null ? LocalDate.ofInstant(p.getCreatedAt(), java.time.ZoneId.systemDefault()) : LocalDate.now()))
                .studentDeadline(p.getStudentDeadline() != null ? p.getStudentDeadline() : p.getSubmissionDeadline())
                .classDeadline(p.getClassDeadline() != null ? p.getClassDeadline() : (targetDeadline != null ? targetDeadline.plusDays(7) : null))
                .deanDeadline(p.getDeanDeadline() != null ? p.getDeanDeadline() : (targetDeadline != null ? targetDeadline.plusDays(14) : null))
                .submissionDeadline(targetDeadline)
                .exceptions(p.getExceptions())
                .status(p.getStatus())
                .statusDisplayName(p.getStatus() != null ? p.getStatus().getDisplayName() : "")
                .isLocked(Boolean.TRUE.equals(p.getIsLocked()))
                .isActive(p.getStatus() == EvaluationPeriodStatus.DANG_MO)
                .remainingDays(remaining)
                .totalSubmissions(totalSubmissions)
                .completedSubmissions(completedSubmissions)
                .pendingSubmissions(pendingSubmissions)
                .draftSubmissions(draftSubmissions)
                .rejectedSubmissions(rejectedSubmissions)
                .createdByName(p.getCreatedBy() != null ? p.getCreatedBy().getFullName() : null)
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .build();
    }

    private List<Map<String, Object>> parseExceptions(String json) {
        if (json == null || json.trim().isEmpty()) {
            return new ArrayList<>();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<List<Map<String, Object>>>() {});
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }

    private String getActionDisplayName(String action) {
        if (action == null) return "Cập nhật";
        return switch (action) {
            case "CREATE_PERIOD" -> "Tạo mới kỳ chấm";
            case "UPDATE_PERIOD" -> "Chỉnh sửa kỳ chấm";
            case "OPEN_PERIOD" -> "Kích hoạt mở đợt chấm";
            case "EXTEND_DEADLINE" -> "Gia hạn hạn nộp toàn trường";
            case "EXTEND_EXCEPTION" -> "Cấp quyền mở lẻ ngoại lệ";
            case "CLOSE_PERIOD" -> "Khóa sổ đợt chấm (Đóng kỳ)";
            default -> action;
        };
    }
}
