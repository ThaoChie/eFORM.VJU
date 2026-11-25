package vn.edu.drl.backend.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import vn.edu.drl.backend.dao.EmailLogRepository;
import vn.edu.drl.backend.model.EmailLog;
import vn.edu.drl.backend.model.EvaluationPeriod;
import vn.edu.drl.backend.model.ScoreForm;
import vn.edu.drl.backend.model.User;
import vn.edu.drl.backend.service.engine.EmailTemplateBuilder;
import vn.edu.drl.backend.service.interfaces.EmailService;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class BrevoEmailServiceImpl implements EmailService {

    private final EmailLogRepository emailLogRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${brevo.api-key:}")
    private String apiKey;

    @Value("${brevo.sender-email:no-reply@vju.ac.vn}")
    private String senderEmail;

    @Value("${brevo.sender-name:Trường Đại học Việt Nhật (VJU) - Hệ thống ĐRL}")
    private String senderName;

    @Value("${brevo.api-url:https://api.brevo.com/v3/smtp/email}")
    private String apiUrl;

    @Value("${brevo.app-base-url:https://e-form-vju-staging.vercel.app}")
    private String appBaseUrl;

    @Value("${brevo.enabled:true}")
    private boolean enabled;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm").withZone(ZoneId.of("Asia/Ho_Chi_Minh"));

    /**
     * Chuẩn hóa Base URL: Luôn đảm bảo trỏ về môi trường staging hợp lệ và loại bỏ mọi giá trị localhost
     */
    private String getBaseUrl() {
        if (appBaseUrl == null || appBaseUrl.trim().isEmpty() || appBaseUrl.contains("localhost") || appBaseUrl.contains("127.0.0.1")) {
            return "https://e-form-vju-staging.vercel.app";
        }
        return appBaseUrl.trim().replaceAll("/+$", "");
    }

    /**
     * Gửi email qua Brevo REST API (Bất đồng bộ trong nền, chống nghẽn luồng chính)
     */
    @Async
    public void sendEmailRawAsync(String toEmail, String toName, String subject, String htmlContent, String templateType, String attachmentName, String attachmentBase64) {
        if (toEmail == null || toEmail.trim().isEmpty()) {
            log.warn("Bỏ qua gửi email do địa chỉ người nhận trống");
            return;
        }

        EmailLog emailLog = EmailLog.builder()
                .recipientEmail(toEmail.trim())
                .recipientName(toName != null ? toName.trim() : "")
                .subject(subject)
                .templateType(templateType)
                .status("PENDING")
                .build();

        // 1. Kiểm tra cấu hình API Key
        boolean hasValidKey = apiKey != null && !apiKey.trim().isEmpty() && !apiKey.contains("your_brevo_api_key");
        if (!enabled || !hasValidKey) {
            log.info("[BREVO SIMULATED] Key chưa cấu hình hoặc bị tắt. Mô phỏng gửi email tới {}: {}", toEmail, subject);
            emailLog.setStatus("SIMULATED_SENT");
            emailLog.setBrevoMessageId("mock-msg-" + UUID.randomUUID());
            emailLog.setSentAt(Instant.now());
            emailLogRepository.save(emailLog);
            return;
        }

        // 2. Gọi Brevo Transactional Email REST API
        try {
            RestClient restClient = RestClient.builder().build();

            Map<String, Object> payload = new HashMap<>();
            payload.put("sender", Map.of("name", senderName, "email", senderEmail));
            payload.put("to", List.of(Map.of("email", toEmail.trim(), "name", toName != null ? toName.trim() : toEmail)));
            payload.put("subject", subject);
            payload.put("htmlContent", htmlContent);

            if (attachmentName != null && attachmentBase64 != null && !attachmentBase64.trim().isEmpty()) {
                payload.put("attachment", List.of(Map.of(
                        "name", attachmentName,
                        "content", attachmentBase64
                )));
            }

            String responseBody = restClient.post()
                    .uri(apiUrl)
                    .header("api-key", apiKey.trim())
                    .header("accept", "application/json")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(payload)
                    .retrieve()
                    .body(String.class);

            String messageId = null;
            if (responseBody != null) {
                try {
                    JsonNode jsonNode = objectMapper.readTree(responseBody);
                    if (jsonNode.has("messageId")) {
                        messageId = jsonNode.get("messageId").asText();
                    }
                } catch (Exception ignored) {}
            }

            emailLog.setStatus("SENT");
            emailLog.setBrevoMessageId(messageId != null ? messageId : "sent-ok");
            emailLog.setSentAt(Instant.now());
            log.info("[BREVO] Đã gửi email thành công tới {}. MessageId: {}", toEmail, messageId);
        } catch (Exception e) {
            log.error("[BREVO ERROR] Không thể gửi email tới {}: {}", toEmail, e.getMessage());
            emailLog.setStatus("FAILED");
            emailLog.setErrorMessage(e.getMessage());
        } finally {
            try {
                emailLogRepository.save(emailLog);
            } catch (Exception ex) {
                log.error("Không thể lưu email_log: {}", ex.getMessage());
            }
        }
    }

    // ==========================================
    // NHÓM 1: XÁC THỰC, TÀI KHOẢN & BẢO MẬT
    // ==========================================

    @Override
    @Async
    public void sendAccountCreatedEmail(User user, String tempPassword) {
        if (user == null || user.getEmail() == null) return;
        String loginUrl = getBaseUrl() + "/login";
        String html = EmailTemplateBuilder.buildAccountCreatedEmail(
                user.getFullName(),
                user.getEmail(),
                tempPassword,
                loginUrl
        );
        sendEmailRawAsync(
                user.getEmail(),
                user.getFullName(),
                "[VJU E-DRL] Cấp tài khoản mới và Mật khẩu khởi tạo tạm thời",
                html,
                "ACCOUNT_CREATED",
                null,
                null
        );
    }

    @Override
    @Async
    public void sendPasswordResetEmail(User user, String otp, String resetToken) {
        if (user == null || user.getEmail() == null) return;
        String resetUrl = getBaseUrl() + "/login?resetToken=" + resetToken;
        String html = EmailTemplateBuilder.buildPasswordResetEmail(
                user.getFullName(),
                otp,
                resetUrl
        );
        sendEmailRawAsync(
                user.getEmail(),
                user.getFullName(),
                "[VJU E-DRL] Mã xác thực đặt lại mật khẩu",
                html,
                "PASSWORD_RESET",
                null,
                null
        );
    }

    @Override
    @Async
    public void sendSignaturePermissionEmail(User user, Instant expiry) {
        if (user == null || user.getEmail() == null) return;
        String expiryStr = (expiry != null) ? DATE_FORMATTER.format(expiry) : "7 ngày sau khi cấp";
        String signatureUrl = getBaseUrl() + (user.getRole() != null ? "/" + user.getRole().name().toLowerCase().replace("_", "-") : "") + "/signature";
        String html = EmailTemplateBuilder.buildSignaturePermissionGrantedEmail(
                user.getFullName(),
                expiryStr,
                signatureUrl
        );
        sendEmailRawAsync(
                user.getEmail(),
                user.getFullName(),
                "[VJU E-DRL] Thông báo cấp quyền thay đổi chữ ký số cá nhân",
                html,
                "SIGNATURE_PERMISSION_GRANTED",
                null,
                null
        );
    }

    // ==========================================
    // NHÓM 2: DÀNH CHO SINH VIÊN
    // ==========================================

    @Override
    @Async
    public void sendNewEvaluationPeriodEmail(List<User> recipients, EvaluationPeriod period) {
        if (recipients == null || recipients.isEmpty() || period == null) return;
        String semesterName = period.getSemester() != null ? period.getSemester().getSemesterName() : "Học kỳ mới";
        String academicYear = period.getSemester() != null ? period.getSemester().getAcademicYear() : "2026-2027";
        String deadlineStr = period.getSubmissionDeadline() != null
                ? period.getSubmissionDeadline().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))
                : "Theo thông báo";
        String composeUrl = getBaseUrl() + "/student/compose";

        for (User u : recipients) {
            if (u.getEmail() == null || u.getEmail().trim().isEmpty()) continue;
            // Kiểm tra tùy chọn nhận thông báo của sinh viên
            if (Boolean.FALSE.equals(u.getEmailRemindersEnabled())) {
                continue;
            }
            String html = EmailTemplateBuilder.buildNewEvaluationPeriodEmail(
                    u.getFullName(),
                    semesterName,
                    academicYear,
                    deadlineStr,
                    composeUrl
            );
            sendEmailRawAsync(
                    u.getEmail(),
                    u.getFullName(),
                    "[VJU E-DRL] Mở cổng đánh giá Điểm Rèn Luyện " + semesterName,
                    html,
                    "NEW_EVALUATION_PERIOD",
                    null,
                    null
            );
        }
    }

    @Override
    @Async
    public void sendFormRejectedEmail(ScoreForm form, String levelTitle, String reason) {
        if (form == null || form.getStudent() == null || form.getStudent().getEmail() == null) return;
        User student = form.getStudent();
        String editUrl = getBaseUrl() + "/student/compose/" + form.getId();
        String html = EmailTemplateBuilder.buildFormRejectedEmail(
                student.getFullName(),
                levelTitle,
                reason,
                editUrl
        );
        sendEmailRawAsync(
                student.getEmail(),
                student.getFullName(),
                "[VJU E-DRL] Phiếu rèn luyện của bạn bị " + levelTitle + " trả lại",
                html,
                "FORM_REJECTED",
                null,
                null
        );
    }

    @Override
    @Async
    public void sendOfficialResultEmail(ScoreForm form, byte[] pdfBytes, String sha256) {
        if (form == null || form.getStudent() == null || form.getStudent().getEmail() == null) return;
        User student = form.getStudent();
        String semesterName = form.getSemester() != null ? form.getSemester().getSemesterName() : "Học kỳ 1 (2026-2027)";
        BigDecimal score = form.getFinalTotal() != null ? form.getFinalTotal() : form.getClassTotal();
        String ranking = form.getRanking() != null ? form.getRanking() : "Tốt";
        String portalUrl = getBaseUrl() + "/student/history";

        String html = EmailTemplateBuilder.buildOfficialResultEmail(
                student.getFullName(),
                semesterName,
                score,
                ranking,
                sha256 != null ? sha256 : "Chưa cập nhật",
                portalUrl
        );

        String pdfBase64 = null;
        if (pdfBytes != null && pdfBytes.length > 0) {
            pdfBase64 = Base64.getEncoder().encodeToString(pdfBytes);
        }

        sendEmailRawAsync(
                student.getEmail(),
                student.getFullName(),
                "[VJU E-DRL] Công bố kết quả Điểm Rèn Luyện chính thức - " + semesterName,
                html,
                "OFFICIAL_RESULT",
                "Bang_Diem_Ren_Luyen_Chinh_Thuc.pdf",
                pdfBase64
        );
    }

    // ==========================================
    // NHÓM 3: DÀNH CHO CÁN BỘ LỚP
    // ==========================================

    @Override
    @Async
    public void sendClassLeaderDeadlineReminder(User classLeader, String className, List<String> pendingStudentNames) {
        if (classLeader == null || classLeader.getEmail() == null) return;
        if (Boolean.FALSE.equals(classLeader.getEmailRemindersEnabled())) return;

        String reviewUrl = getBaseUrl() + "/class-leader/review";
        String html = EmailTemplateBuilder.buildClassLeaderReminderEmail(
                classLeader.getFullName(),
                className,
                pendingStudentNames,
                reviewUrl
        );
        sendEmailRawAsync(
                classLeader.getEmail(),
                classLeader.getFullName(),
                "[VJU E-DRL] Nhắc nhở hạn chót hoàn thành thẩm định ĐRL lớp " + className,
                html,
                "CLASS_LEADER_REMINDER",
                null,
                null
        );
    }

    @Override
    @Async
    public void sendClassLeaderFormRejectedNotice(User classLeader, String className, String studentName, String studentCode, String reason) {
        if (classLeader == null || classLeader.getEmail() == null) return;
        if (Boolean.FALSE.equals(classLeader.getEmailClassUpdatesEnabled())) return;

        String queueUrl = getBaseUrl() + "/class-leader/review";
        String html = EmailTemplateBuilder.buildClassLeaderFormRejectedNoticeEmail(
                classLeader.getFullName(),
                className,
                studentName,
                studentCode,
                reason,
                queueUrl
        );
        sendEmailRawAsync(
                classLeader.getEmail(),
                classLeader.getFullName(),
                "[VJU E-DRL] Thông báo Khoa trả lại phiếu ĐRL của sinh viên " + studentName,
                html,
                "CLASS_FORM_REJECTED_BY_DEAN",
                null,
                null
        );
    }

    // ==========================================
    // NHÓM 4: DÀNH CHO BAN CHỦ NHIỆM KHOA
    // ==========================================

    @Override
    @Async
    public void sendDeanDeadlineReminder(User dean, String deptName, int pendingCount) {
        if (dean == null || dean.getEmail() == null) return;
        if (Boolean.FALSE.equals(dean.getEmailRemindersEnabled())) return;

        String batchUrl = getBaseUrl() + "/dean/batches";
        String html = EmailTemplateBuilder.buildDeanReminderEmail(
                dean.getFullName(),
                deptName,
                pendingCount,
                batchUrl
        );
        sendEmailRawAsync(
                dean.getEmail(),
                dean.getFullName(),
                "[VJU E-DRL] Nhắc nhở hạn chót hoàn thành phê duyệt ĐRL cấp Khoa - " + deptName,
                html,
                "DEAN_REMINDER",
                null,
                null
        );
    }
}
