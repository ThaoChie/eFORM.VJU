package vn.edu.drl.backend.service.engine;

import java.math.BigDecimal;
import java.util.List;

public class EmailTemplateBuilder {

    private static final String BTN_COLOR = "#881337"; // Elegant deep maroon
    private static final String BG_PAGE = "#f9fafb";
    private static final String TEXT_HEADING = "#111827";
    private static final String TEXT_BODY = "#374151";
    private static final String TEXT_MUTED = "#6b7280";
    private static final String BORDER_LINE = "#e5e7eb";

    private static String wrapHtml(String title, String preheader, String contentHtml) {
        return "<!DOCTYPE html>\n" +
                "<html lang=\"vi\">\n" +
                "<head>\n" +
                "  <meta charset=\"UTF-8\">\n" +
                "  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n" +
                "  <title>" + escape(title) + "</title>\n" +
                "  <style>\n" +
                "    body { margin: 0; padding: 0; background-color: " + BG_PAGE + "; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: " + TEXT_BODY + "; line-height: 1.5; -webkit-font-smoothing: antialiased; }\n" +
                "    .container { max-width: 540px; margin: 30px auto; background-color: #ffffff; border: 1px solid " + BORDER_LINE + "; border-radius: 8px; padding: 32px 28px; }\n" +
                "    .btn { display: inline-block; background-color: " + BTN_COLOR + "; color: #ffffff !important; padding: 10px 22px; border-radius: 6px; font-weight: 600; font-size: 13px; text-decoration: none; }\n" +
                "    .table-info { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px; }\n" +
                "    .table-info td { padding: 9px 0; border-bottom: 1px solid #f3f4f6; }\n" +
                "    .table-info .lbl { color: " + TEXT_MUTED + "; width: 150px; }\n" +
                "    .table-info .val { color: " + TEXT_HEADING + "; font-weight: 500; }\n" +
                "    .footer { font-size: 11px; color: #9ca3af; line-height: 1.5; margin-top: 28px; padding-top: 18px; border-top: 1px solid #f3f4f6; }\n" +
                "  </style>\n" +
                "</head>\n" +
                "<body>\n" +
                "  <div style=\"display:none;font-size:1px;color:#fff;max-height:0;overflow:hidden;\">" + escape(preheader) + "</div>\n" +
                "  <div style=\"padding: 20px 10px;\">\n" +
                "    <div class=\"container\">\n" +
                "      <!-- Header tối giản -->\n" +
                "      <div style=\"margin-bottom: 22px; padding-bottom: 16px; border-bottom: 1px solid " + BORDER_LINE + ";\">\n" +
                "        <div style=\"font-size: 13px; font-weight: 700; color: " + TEXT_HEADING + "; text-transform: uppercase; letter-spacing: 0.3px;\">TRƯỜNG ĐẠI HỌC VIỆT NHẬT - ĐHQGHN</div>\n" +
                "        <div style=\"font-size: 12px; color: " + TEXT_MUTED + "; margin-top: 2px;\">Hệ thống Đánh giá Điểm Rèn Luyện (E-Form VJU)</div>\n" +
                "      </div>\n" +
                "      \n" +
                "      <!-- Nội dung chính -->\n" +
                contentHtml +
                "      \n" +
                "      <!-- Footer -->\n" +
                "      <div class=\"footer\">\n" +
                "        Đây là email tự động từ Hệ thống E-Form VJU. Vui lòng không trả lời trực tiếp email này.<br/>\n" +
                "        Trường Đại học Việt Nhật - Đường Lưu Hữu Phước, P. Cầu Diễn, Q. Nam Từ Liêm, Hà Nội.\n" +
                "      </div>\n" +
                "    </div>\n" +
                "  </div>\n" +
                "</body>\n" +
                "</html>";
    }

    private static String escape(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;");
    }

    // ==========================================
    // NHÓM 1: XÁC THỰC, TÀI KHOẢN & BẢO MẬT
    // ==========================================

    /**
     * Luồng 1.1: Cấp tài khoản mới và Mật khẩu khởi tạo
     */
    public static String buildAccountCreatedEmail(String fullName, String email, String tempPassword, String loginUrl) {
        String content = "<p style=\"font-size: 14px; margin-top: 0;\">Xin chào <b>" + escape(fullName) + "</b>,</p>\n" +
                "<p style=\"font-size: 13px; color: " + TEXT_BODY + ";\">Tài khoản của bạn trên Hệ thống Đánh giá Điểm Rèn Luyện E-Form VJU đã được khởi tạo thành công với thông tin như sau:</p>\n" +
                "<table class=\"table-info\">\n" +
                "  <tr><td class=\"lbl\">Tên đăng nhập (Email)</td><td class=\"val\">" + escape(email) + "</td></tr>\n" +
                "  <tr><td class=\"lbl\">Mật khẩu tạm thời</td><td class=\"val\"><code style=\"font-family: monospace; font-size: 14px; font-weight: 600; background: #f3f4f6; padding: 2px 6px; border-radius: 4px;\">" + escape(tempPassword) + "</code></td></tr>\n" +
                "</table>\n" +
                "<p style=\"font-size: 12px; color: " + TEXT_MUTED + "; margin: 12px 0 20px;\">* <i>Lưu ý bảo mật: Bạn vui lòng đổi mật khẩu ở lần đăng nhập đầu tiên để bảo vệ an toàn tài khoản.</i></p>\n" +
                "<div style=\"margin: 20px 0;\">\n" +
                "  <a href=\"" + escape(loginUrl) + "\" class=\"btn\">Đăng nhập hệ thống</a>\n" +
                "</div>\n" +
                "<p style=\"font-size: 11px; color: #9ca3af; margin: 14px 0 0;\">Đường dẫn truy cập: <a href=\"" + escape(loginUrl) + "\" style=\"color: " + BTN_COLOR + "; word-break: break-all;\">" + escape(loginUrl) + "</a></p>";

        return wrapHtml("Cấp tài khoản mới trên Hệ thống E-Form VJU", "Thông tin tài khoản E-Form VJU", content);
    }

    /**
     * Luồng 1.2: Yêu cầu đặt lại mật khẩu (Quên mật khẩu)
     */
    public static String buildPasswordResetEmail(String fullName, String otp, String resetUrl) {
        String content = "<p style=\"font-size: 14px; margin-top: 0;\">Xin chào <b>" + escape(fullName) + "</b>,</p>\n" +
                "<p style=\"font-size: 13px; color: " + TEXT_BODY + ";\">Hệ thống nhận được yêu cầu đặt lại mật khẩu cho tài khoản E-Form VJU của bạn. Bạn có thể sử dụng mã OTP dưới đây hoặc nhấn nút liên kết:</p>\n" +
                "<div style=\"margin: 16px 0; text-align: center;\">\n" +
                "  <div style=\"font-family: monospace; font-size: 22px; font-weight: 700; letter-spacing: 5px; color: " + TEXT_HEADING + "; padding: 10px 18px; background: #f3f4f6; border-radius: 6px; display: inline-block;\">" + escape(otp) + "</div>\n" +
                "</div>\n" +
                "<div style=\"margin: 18px 0; text-align: center;\">\n" +
                "  <a href=\"" + escape(resetUrl) + "\" class=\"btn\">Đặt lại mật khẩu</a>\n" +
                "</div>\n" +
                "<p style=\"font-size: 12px; color: " + TEXT_MUTED + "; margin-top: 14px;\">* Mã xác thực và liên kết này có hiệu lực trong <b>15 phút</b> và chỉ sử dụng được 1 lần. Nếu bạn không gửi yêu cầu, vui lòng bỏ qua email này.</p>";

        return wrapHtml("Yêu cầu đặt lại mật khẩu E-Form VJU", "Mã xác thực: " + otp, content);
    }

    /**
     * Luồng 1.3: Gửi thông báo chữ ký số cá nhân (Mở quyền thay đổi chữ ký)
     */
    public static String buildSignaturePermissionGrantedEmail(String fullName, String expiryDateStr, String signatureUrl) {
        String content = "<p style=\"font-size: 14px; margin-top: 0;\">Xin chào <b>" + escape(fullName) + "</b>,</p>\n" +
                "<p style=\"font-size: 13px; color: " + TEXT_BODY + ";\">Quản trị viên đã mở quyền thay đổi mẫu chữ ký số cá nhân cho tài khoản của bạn (quy trình UC-AUTH-03).</p>\n" +
                "<table class=\"table-info\">\n" +
                "  <tr><td class=\"lbl\">Trạng thái</td><td class=\"val\" style=\"color: #047857;\">Được phép thay đổi</td></tr>\n" +
                "  <tr><td class=\"lbl\">Thời hạn hiệu lực</td><td class=\"val\">" + escape(expiryDateStr) + " (7 ngày)</td></tr>\n" +
                "</table>\n" +
                "<p style=\"font-size: 12px; color: " + TEXT_MUTED + "; margin: 12px 0 20px;\">* Sau thời hạn trên, mẫu chữ ký số sẽ được tự động khóa cố định để đảm bảo giá trị pháp lý.</p>\n" +
                "<div style=\"margin: 20px 0;\">\n" +
                "  <a href=\"" + escape(signatureUrl) + "\" class=\"btn\">Cập nhật chữ ký số</a>\n" +
                "</div>";

        return wrapHtml("Cấp quyền thay đổi chữ ký số cá nhân E-Form VJU", "Đã mở quyền cập nhật chữ ký số", content);
    }

    // ==========================================
    // NHÓM 2: DÀNH CHO SINH VIÊN
    // ==========================================

    /**
     * Luồng 2.1: Mở kỳ đánh giá rèn luyện mới
     */
    public static String buildNewEvaluationPeriodEmail(String fullName, String semesterName, String academicYear, String deadlineStr, String composeUrl) {
        String content = "<p style=\"font-size: 14px; margin-top: 0;\">Xin chào <b>" + escape(fullName) + "</b>,</p>\n" +
                "<p style=\"font-size: 13px; color: " + TEXT_BODY + ";\">Nhà trường thông báo mở cổng tự đánh giá Điểm Rèn Luyện cho <b>" + escape(semesterName) + " (Năm học " + escape(academicYear) + ")</b>.</p>\n" +
                "<table class=\"table-info\">\n" +
                "  <tr><td class=\"lbl\">Kỳ đánh giá</td><td class=\"val\">" + escape(semesterName) + " (" + escape(academicYear) + ")</td></tr>\n" +
                "  <tr><td class=\"lbl\">Hạn chót nộp phiếu</td><td class=\"val\" style=\"color: #b91c1c; font-weight: 600;\">" + escape(deadlineStr) + "</td></tr>\n" +
                "</table>\n" +
                "<p style=\"font-size: 12px; color: " + TEXT_MUTED + "; margin: 12px 0 20px;\">* Sinh viên tự chấm điểm theo các tiêu chí và đính kèm đầy đủ tài liệu minh chứng hợp lệ trước thời hạn trên.</p>\n" +
                "<div style=\"margin: 20px 0;\">\n" +
                "  <a href=\"" + escape(composeUrl) + "\" class=\"btn\">Soạn phiếu rèn luyện</a>\n" +
                "</div>";

        return wrapHtml("Thông báo mở kỳ đánh giá ĐRL " + semesterName, "Mở cổng đánh giá ĐRL hạn " + deadlineStr, content);
    }

    /**
     * Luồng 2.2: Phiếu rèn luyện bị TRẢ LẠI
     */
    public static String buildFormRejectedEmail(String fullName, String levelTitle, String rejectReason, String editUrl) {
        String content = "<p style=\"font-size: 14px; margin-top: 0;\">Xin chào <b>" + escape(fullName) + "</b>,</p>\n" +
                "<p style=\"font-size: 13px; color: " + TEXT_BODY + ";\">Phiếu đánh giá Điểm Rèn Luyện của bạn đã được <b>" + escape(levelTitle) + "</b> xem xét và gửi trả lại để yêu cầu chỉnh sửa, bổ sung thông tin.</p>\n" +
                "<table class=\"table-info\">\n" +
                "  <tr><td class=\"lbl\">Cấp trả lại</td><td class=\"val\">" + escape(levelTitle) + "</td></tr>\n" +
                "  <tr><td class=\"lbl\" style=\"vertical-align: top;\">Lý do chi tiết</td><td class=\"val\" style=\"white-space: pre-line; color: #991b1b;\">" + escape(rejectReason) + "</td></tr>\n" +
                "</table>\n" +
                "<p style=\"font-size: 12px; color: " + TEXT_MUTED + "; margin: 12px 0 20px;\">* Chữ ký số cũ đã được hệ thống thu hồi an toàn. Bạn vui lòng kiểm tra lại điểm tự chấm và minh chứng, ký xác nhận lại và nộp trước thời hạn.</p>\n" +
                "<div style=\"margin: 20px 0;\">\n" +
                "  <a href=\"" + escape(editUrl) + "\" class=\"btn\">Chỉnh sửa phiếu</a>\n" +
                "</div>";

        return wrapHtml("Phiếu rèn luyện bị trả lại - Cần hoàn thiện", "Phiếu ĐRL bị " + levelTitle + " trả lại", content);
    }

    /**
     * Luồng 2.3: Công bố kết quả chính thức (DEAN_APPROVED)
     */
    public static String buildOfficialResultEmail(String fullName, String semesterName, BigDecimal finalScore, String ranking, String sha256Hash, String portalUrl) {
        String scoreStr = (finalScore != null ? finalScore.stripTrailingZeros().toPlainString() : "0");
        String content = "<p style=\"font-size: 14px; margin-top: 0;\">Xin chào <b>" + escape(fullName) + "</b>,</p>\n" +
                "<p style=\"font-size: 13px; color: " + TEXT_BODY + ";\">Phiếu Điểm Rèn Luyện của bạn cho <b>" + escape(semesterName) + "</b> đã được Ban Chủ nhiệm Khoa phê duyệt chính thức và hoàn tất ký số đóng gói.</p>\n" +
                "<table class=\"table-info\">\n" +
                "  <tr><td class=\"lbl\">Học kỳ</td><td class=\"val\">" + escape(semesterName) + "</td></tr>\n" +
                "  <tr><td class=\"lbl\">Điểm chính thức</td><td class=\"val\" style=\"font-size: 15px; font-weight: 700; color: #047857;\">" + scoreStr + " điểm</td></tr>\n" +
                "  <tr><td class=\"lbl\">Xếp loại</td><td class=\"val\" style=\"font-weight: 600;\">" + escape(ranking) + "</td></tr>\n" +
                "  <tr><td class=\"lbl\">Mã băm SHA-256</td><td class=\"val\" style=\"font-family: monospace; font-size: 11px; word-break: break-all; color: #64748b;\">" + escape(sha256Hash) + "</td></tr>\n" +
                "</table>\n" +
                "<p style=\"font-size: 12px; color: " + TEXT_MUTED + "; margin: 12px 0 20px;\">* Tệp PDF Bảng điểm rèn luyện chính thức có chữ ký số niêm phong DocMDP P=1 được đính kèm cùng email này.</p>\n" +
                "<div style=\"margin: 20px 0;\">\n" +
                "  <a href=\"" + escape(portalUrl) + "\" class=\"btn\">Xem lịch sử trên hệ thống</a>\n" +
                "</div>";

        return wrapHtml("Công bố kết quả Điểm Rèn Luyện chính thức - " + semesterName, "Kết quả chính thức: " + scoreStr + "đ (" + ranking + ")", content);
    }

    // ==========================================
    // NHÓM 3: DÀNH CHO CÁN BỘ LỚP
    // ==========================================

    /**
     * Luồng 3.1: Nhắc nhở hạn chót hoàn thành chấm điểm cấp Lớp
     */
    public static String buildClassLeaderReminderEmail(String leaderName, String className, List<String> pendingStudentNames, String reviewQueueUrl) {
        StringBuilder studentsHtml = new StringBuilder("<ul style=\"margin: 6px 0; padding-left: 18px; color: " + TEXT_BODY + "; font-size: 12px;\">");
        int count = 0;
        for (String s : pendingStudentNames) {
            studentsHtml.append("<li>").append(escape(s)).append("</li>");
            count++;
            if (count >= 15 && pendingStudentNames.size() > 15) {
                studentsHtml.append("<li><i>và ").append(pendingStudentNames.size() - 15).append(" sinh viên khác...</i></li>");
                break;
            }
        }
        studentsHtml.append("</ul>");

        String content = "<p style=\"font-size: 14px; margin-top: 0;\">Kính gửi <b>" + escape(leaderName) + "</b> (Lớp " + escape(className) + "),</p>\n" +
                "<p style=\"font-size: 13px; color: " + TEXT_BODY + ";\">Thời hạn thẩm định Điểm Rèn Luyện cấp Lớp sắp kết thúc. Hiện lớp còn <b>" + pendingStudentNames.size() + " sinh viên</b> đang chờ thẩm định:</p>\n" +
                studentsHtml +
                "<p style=\"font-size: 12px; color: " + TEXT_MUTED + "; margin: 12px 0 20px;\">Đề nghị Ban cán sự lớp hoàn tất thẩm định, ký duyệt và chuyển toàn bộ phiếu lên Khoa đúng hạn.</p>\n" +
                "<div style=\"margin: 20px 0;\">\n" +
                "  <a href=\"" + escape(reviewQueueUrl) + "\" class=\"btn\">Vào duyệt phiếu lớp</a>\n" +
                "</div>";

        return wrapHtml("Nhắc nhở hạn chót thẩm định ĐRL cấp Lớp - " + className, "Lớp còn " + pendingStudentNames.size() + " phiếu chưa duyệt", content);
    }

    /**
     * Luồng 3.2: Thông báo Khoa trả lại phiếu thuộc thẩm quyền của Lớp
     */
    public static String buildClassLeaderFormRejectedNoticeEmail(String leaderName, String className, String studentName, String studentCode, String reason, String queueUrl) {
        String content = "<p style=\"font-size: 14px; margin-top: 0;\">Kính gửi <b>" + escape(leaderName) + "</b> (Lớp " + escape(className) + "),</p>\n" +
                "<p style=\"font-size: 13px; color: " + TEXT_BODY + ";\">Phiếu rèn luyện của sinh viên <b>" + escape(studentName) + "</b> (Mã SV: " + escape(studentCode) + ") đã được Lớp duyệt nhưng vừa bị <b>Ban Chủ nhiệm Khoa trả lại</b>.</p>\n" +
                "<table class=\"table-info\">\n" +
                "  <tr><td class=\"lbl\">Sinh viên</td><td class=\"val\">" + escape(studentName) + " (" + escape(studentCode) + ")</td></tr>\n" +
                "  <tr><td class=\"lbl\" style=\"vertical-align: top;\">Ý kiến từ Khoa</td><td class=\"val\" style=\"color: #991b1b;\">" + escape(reason) + "</td></tr>\n" +
                "</table>\n" +
                "<p style=\"font-size: 12px; color: " + TEXT_MUTED + "; margin: 12px 0 20px;\">Thông báo để Ban cán sự lớp nắm bắt lý do và rút kinh nghiệm cho các lần thẩm định sau.</p>\n" +
                "<div style=\"margin: 20px 0;\">\n" +
                "  <a href=\"" + escape(queueUrl) + "\" class=\"btn\">Xem hàng đợi lớp</a>\n" +
                "</div>";

        return wrapHtml("Khoa trả lại phiếu ĐRL của sinh viên " + studentName, "Khoa trả lại phiếu của SV " + studentName, content);
    }

    // ==========================================
    // NHÓM 4: DÀNH CHO BAN CHỦ NHIỆM KHOA
    // ==========================================

    /**
     * Luồng 4.1: Nhắc nhở hạn chót hoàn thành chấm điểm cấp Khoa
     */
    public static String buildDeanReminderEmail(String deanName, String deptName, int pendingCount, String batchUrl) {
        String content = "<p style=\"font-size: 14px; margin-top: 0;\">Kính gửi Thầy/Cô <b>" + escape(deanName) + "</b> (" + escape(deptName) + "),</p>\n" +
                "<p style=\"font-size: 13px; color: " + TEXT_BODY + ";\">Hệ thống xin thông báo nhắc nhở tiến độ phê duyệt Điểm Rèn Luyện cấp Khoa trước thời điểm đóng cổng cấp trường.</p>\n" +
                "<table class=\"table-info\">\n" +
                "  <tr><td class=\"lbl\">Đơn vị</td><td class=\"val\">" + escape(deptName) + "</td></tr>\n" +
                "  <tr><td class=\"lbl\">Số phiếu chờ duyệt</td><td class=\"val\" style=\"font-weight: 700; color: #b91c1c;\">" + pendingCount + " phiếu</td></tr>\n" +
                "</table>\n" +
                "<p style=\"font-size: 12px; color: " + TEXT_MUTED + "; margin: 12px 0 20px;\">Kính đề nghị Thầy/Cô kiểm tra và hoàn tất phê duyệt / ký số lô trước hạn quy định.</p>\n" +
                "<div style=\"margin: 20px 0;\">\n" +
                "  <a href=\"" + escape(batchUrl) + "\" class=\"btn\">Vào trang Duyệt lô cấp Khoa</a>\n" +
                "</div>";

        return wrapHtml("Nhắc nhở hạn chót phê duyệt ĐRL cấp Khoa - " + deptName, "Khoa còn " + pendingCount + " phiếu chờ duyệt", content);
    }
}
