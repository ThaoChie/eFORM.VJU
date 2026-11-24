package vn.edu.drl.backend.service.interfaces;

import vn.edu.drl.backend.model.EvaluationPeriod;
import vn.edu.drl.backend.model.ScoreForm;
import vn.edu.drl.backend.model.User;

import java.time.Instant;
import java.util.List;

public interface EmailService {
    // Luồng 1.1: Cấp tài khoản mới và Mật khẩu khởi tạo
    void sendAccountCreatedEmail(User user, String tempPassword);

    // Luồng 1.2: Yêu cầu đặt lại mật khẩu (OTP / Token)
    void sendPasswordResetEmail(User user, String otp, String resetToken);

    // Luồng 1.3: Gửi thông báo cấp quyền thay đổi chữ ký số cá nhân
    void sendSignaturePermissionEmail(User user, Instant expiry);

    // Luồng 2.1: Mở kỳ đánh giá rèn luyện mới
    void sendNewEvaluationPeriodEmail(List<User> recipients, EvaluationPeriod period);

    // Luồng 2.2: Phiếu rèn luyện bị TRẢ LẠI
    void sendFormRejectedEmail(ScoreForm form, String levelTitle, String reason);

    // Luồng 2.3: Công bố kết quả chính thức (DEAN_APPROVED)
    void sendOfficialResultEmail(ScoreForm form, byte[] pdfBytes, String sha256);

    // Luồng 3.1: Nhắc nhở hạn chót hoàn thành chấm điểm cấp Lớp
    void sendClassLeaderDeadlineReminder(User classLeader, String className, List<String> pendingStudentNames);

    // Luồng 3.2: Thông báo Khoa trả lại phiếu thuộc thẩm quyền của Lớp
    void sendClassLeaderFormRejectedNotice(User classLeader, String className, String studentName, String studentCode, String reason);

    // Luồng 4.1: Nhắc nhở hạn chót hoàn thành chấm điểm cấp Khoa
    void sendDeanDeadlineReminder(User dean, String deptName, int pendingCount);
}
