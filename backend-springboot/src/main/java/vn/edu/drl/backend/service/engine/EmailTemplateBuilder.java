package vn.edu.drl.backend.service.engine;

import java.math.BigDecimal;
import java.util.List;

public class EmailTemplateBuilder {

    private static final String BRAND_COLOR = "#881337"; // Rose-900 / Cherry red
    private static final String ACCENT_COLOR = "#be123c";
    private static final String BG_COLOR = "#f8fafc";
    private static final String TEXT_MAIN = "#1e293b";
    private static final String TEXT_MUTED = "#64748b";

    private static String wrapHtml(String title, String preheader, String contentHtml) {
        return "<!DOCTYPE html>\n" +
                "<html lang=\"vi\">\n" +
                "<head>\n" +
                "  <meta charset=\"UTF-8\">\n" +
                "  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n" +
                "  <title>" + escape(title) + "</title>\n" +
                "  <style>\n" +
                "    body { margin: 0; padding: 0; background-color: " + BG_COLOR + "; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: " + TEXT_MAIN + "; -webkit-font-smoothing: antialiased; }\n" +
                "    table { border-collapse: collapse; }\n" +
                "    .btn { display: inline-block; background-color: " + BRAND_COLOR + "; color: #ffffff !important; padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 14px; text-decoration: none; margin: 16px 0; }\n" +
                "    .card { background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 32px; margin: 24px auto; max-width: 600px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }\n" +
                "    .badge { display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: 700; }\n" +
                "    .badge-amber { background-color: #fef3c7; color: #b45309; }\n" +
                "    .badge-red { background-color: #ffe4e6; color: #9f1239; }\n" +
                "    .badge-emerald { background-color: #d1fae5; color: #047857; }\n" +
                "    .footer { font-size: 12px; color: " + TEXT_MUTED + "; text-align: center; margin-top: 24px; line-height: 1.5; }\n" +
                "    .info-box { background-color: #f1f5f9; border-radius: 8px; padding: 16px; margin: 16px 0; font-size: 13px; line-height: 1.6; border-left: 4px solid " + BRAND_COLOR + "; }\n" +
                "    .code-box { font-family: monospace; font-size: 18px; font-weight: bold; background: #e2e8f0; padding: 10px 16px; border-radius: 6px; letter-spacing: 4px; display: inline-block; color: #0f172a; }\n" +
                "  </style>\n" +
                "</head>\n" +
                "<body>\n" +
                "  <div style=\"display:none;font-size:1px;color:#fff;max-height:0;overflow:hidden;\">" + escape(preheader) + "</div>\n" +
                "  <div style=\"padding: 30px 15px;\">\n" +
                "    <div class=\"card\">\n" +
                "      <!-- Header -->\n" +
                "      <div style=\"text-align: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 24px;\">\n" +
                "        <h2 style=\"margin: 0; color: " + BRAND_COLOR + "; font-size: 18px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;\">TRƯỜNG ĐẠI HỌC VIỆT NHẬT - ĐHQGHN</h2>\n" +
                "        <p style=\"margin: 4px 0 0; color: " + TEXT_MUTED + "; font-size: 13px;\">Hệ thống Đánh giá Điểm Rèn Luyện Trực tuyến (E-Form VJU)</p>\n" +
                "      </div>\n" +
                "      \n" +
                "      <!-- Content -->\n" +
                "      <div>\n" +
                contentHtml +
                "      </div>\n" +
                "      \n" +
                "      <!-- Footer -->\n" +
                "      <div class=\"footer\">\n" +
                "        <p style=\"margin: 16px 0 4px;\">Email này được gửi tự động từ Hệ thống E-Form VJU. Vui lòng không trả lời trực tiếp email này.</p>\n" +
                "        <p style=\"margin: 0;\">Trường Đại học Việt Nhật - Đường Lưu Hữu Phước, P. Cầu Diễn, Q. Nam Từ Liêm, Hà Nội</p>\n" +
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
        String content = "<h3 style=\"margin-top: 0; color: " + TEXT_MAIN + "; font-size: 16px;\">Kính gửi " + escape(fullName) + ",</h3>\n" +
                "<p style=\"font-size: 14px; line-height: 1.6;\">Tài khoản của bạn trên <b>Hệ thống Đánh giá Điểm Rèn Luyện E-Form VJU</b> đã được quản trị viên khởi tạo thành công.</p>\n" +
                "<div class=\"info-box\">\n" +
                "  <div style=\"margin-bottom: 8px;\"><b>Tên đăng nhập (Email):</b> " + escape(email) + "</div>\n" +
                "  <div style=\"margin-bottom: 8px;\"><b>Mật khẩu khởi tạo tạm thời:</b> <span style=\"font-family: monospace; font-size: 15px; font-weight: bold; background: #ffffff; padding: 2px 8px; border-radius: 4px; border: 1px solid #cbd5e1;\">" + escape(tempPassword) + "</span></div>\n" +
                "</div>\n" +
                "<div style=\"background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 12px; margin: 16px 0; font-size: 13px; color: #92400e;\">\n" +
                "  <b>⚠️ Lưu ý quan trọng về an toàn tài khoản:</b><br/>\n" +
                "  Đây là mật khẩu khởi tạo tạm thời. Để bảo mật thông tin cá nhân và chữ ký số, <b>bạn bắt buộc phải đổi mật khẩu ở lần đăng nhập đầu tiên</b> trước khi có thể sử dụng các chức năng của hệ thống.\n" +
                "</div>\n" +
                "<div style=\"text-align: center; margin: 24px 0;\">\n" +
                "  <a href=\"" + escape(loginUrl) + "\" class=\"btn\">Đăng nhập và Đổi mật khẩu ngay</a>\n" +
                "</div>\n" +
                "<p style=\"font-size: 12px; color: " + TEXT_MUTED + ";\">Nếu nút bấm trên không hoạt động, bạn có thể sao chép liên kết sau vào trình duyệt: <br/><a href=\"" + escape(loginUrl) + "\" style=\"color: " + ACCENT_COLOR + "; word-break: break-all;\">" + escape(loginUrl) + "</a></p>";

        return wrapHtml("Cấp tài khoản mới trên Hệ thống E-Form VJU", "Thông tin tài khoản E-Form VJU của bạn", content);
    }

    /**
     * Luồng 1.2: Yêu cầu đặt lại mật khẩu (Quên mật khẩu)
     */
    public static String buildPasswordResetEmail(String fullName, String otp, String resetUrl) {
        String content = "<h3 style=\"margin-top: 0; color: " + TEXT_MAIN + "; font-size: 16px;\">Kính gửi " + escape(fullName) + ",</h3>\n" +
                "<p style=\"font-size: 14px; line-height: 1.6;\">Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản E-Form VJU của bạn.</p>\n" +
                "<p style=\"font-size: 14px; margin-bottom: 8px;\">Mã xác thực OTP (dùng cho ứng dụng hoặc màn hình xác nhận):</p>\n" +
                "<div style=\"text-align: center; margin: 12px 0 20px;\">\n" +
                "  <div class=\"code-box\">" + escape(otp) + "</div>\n" +
                "</div>\n" +
                "<p style=\"font-size: 14px; line-height: 1.6;\">Hoặc bạn có thể nhấp trực tiếp vào nút bên dưới để tiến hành đặt lại mật khẩu bảo mật:</p>\n" +
                "<div style=\"text-align: center; margin: 20px 0;\">\n" +
                "  <a href=\"" + escape(resetUrl) + "\" class=\"btn\">Đặt lại mật khẩu</a>\n" +
                "</div>\n" +
                "<div style=\"background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 12px; margin: 16px 0; font-size: 13px; color: #1e40af;\">\n" +
                "  ℹ️ Mã xác thực và đường dẫn này chỉ <b>có hiệu lực trong vòng 15 phút</b> và chỉ sử dụng được <b>1 lần duy nhất</b>.<br/>\n" +
                "  Nếu bạn không yêu cầu thao tác này, xin vui lòng bỏ qua email và mật khẩu của bạn vẫn được giữ nguyên an toàn.\n" +
                "</div>";

        return wrapHtml("Yêu cầu đặt lại mật khẩu E-Form VJU", "Mã xác thực đặt lại mật khẩu của bạn: " + otp, content);
    }

    /**
     * Luồng 1.3: Gửi thông báo chữ ký số cá nhân (Mở quyền thay đổi chữ ký)
     */
    public static String buildSignaturePermissionGrantedEmail(String fullName, String expiryDateStr, String signatureUrl) {
        String content = "<h3 style=\"margin-top: 0; color: " + TEXT_MAIN + "; font-size: 16px;\">Kính gửi " + escape(fullName) + ",</h3>\n" +
                "<p style=\"font-size: 14px; line-height: 1.6;\">Quản trị viên hệ thống đã phê duyệt mở quyền thay đổi mẫu chữ ký số cá nhân cho tài khoản của bạn (theo quy trình UC-AUTH-03).</p>\n" +
                "<div class=\"info-box\">\n" +
                "  <div style=\"margin-bottom: 8px;\"><b>Trạng thái:</b> <span class=\"badge badge-emerald\">Đã mở quyền cập nhật chữ ký số</span></div>\n" +
                "  <div><b>Thời hạn hiệu lực:</b> Quyền này có hiệu lực trong <b>7 ngày</b> (hết hạn vào lúc <b>" + escape(expiryDateStr) + "</b>). Sau thời gian này, mẫu chữ ký số sẽ được tự động khóa cố định để đảm bảo giá trị pháp lý.</div>\n" +
                "</div>\n" +
                "<div style=\"text-align: center; margin: 24px 0;\">\n" +
                "  <a href=\"" + escape(signatureUrl) + "\" class=\"btn\">Cập nhật chữ ký số ngay</a>\n" +
                "</div>\n" +
                "<p style=\"font-size: 12px; color: " + TEXT_MUTED + ";\">Lưu ý: Hệ thống yêu cầu đăng nhập trước khi cập nhật. Vui lòng chuẩn bị ảnh chữ ký rõ nét nền trong suốt hoặc chữ ký số chuẩn.</p>";

        return wrapHtml("Cấp quyền thay đổi chữ ký số cá nhân E-Form VJU", "Bạn đã được cấp quyền cập nhật chữ ký số", content);
    }

    // ==========================================
    // NHÓM 2: DÀNH CHO SINH VIÊN (VÒNG ĐỜI SOẠN & THEO DÕI PHIẾU)
    // ==========================================

    /**
     * Luồng 2.1: Mở kỳ đánh giá rèn luyện mới
     */
    public static String buildNewEvaluationPeriodEmail(String fullName, String semesterName, String academicYear, String deadlineStr, String composeUrl) {
        String content = "<h3 style=\"margin-top: 0; color: " + TEXT_MAIN + "; font-size: 16px;\">Kính gửi sinh viên " + escape(fullName) + ",</h3>\n" +
                "<p style=\"font-size: 14px; line-height: 1.6;\">Nhà trường thông báo chính thức mở cổng tự đánh giá Điểm Rèn Luyện cho <b>" + escape(semesterName) + " - Năm học " + escape(academicYear) + "</b>.</p>\n" +
                "<div class=\"info-box\">\n" +
                "  <div style=\"margin-bottom: 8px;\"><b>Kỳ đánh giá:</b> " + escape(semesterName) + " (" + escape(academicYear) + ")</div>\n" +
                "  <div style=\"margin-bottom: 8px;\"><b>Hạn chót nộp phiếu (Deadline):</b> <span style=\"color: #b91c1c; font-weight: bold;\">" + escape(deadlineStr) + "</span></div>\n" +
                "  <div><b>Yêu cầu:</b> Sinh viên tự chấm điểm theo các tiêu chí và đính kèm đầy đủ minh chứng hợp lệ.</div>\n" +
                "</div>\n" +
                "<p style=\"font-size: 13px; color: #b45309;\">⚠️ Sau thời hạn trên, cổng tự đánh giá sẽ tự động khóa và các phiếu chưa nộp sẽ không được ghi nhận.</p>\n" +
                "<div style=\"text-align: center; margin: 24px 0;\">\n" +
                "  <a href=\"" + escape(composeUrl) + "\" class=\"btn\">Truy cập trang Soạn phiếu ĐRL</a>\n" +
                "</div>";

        return wrapHtml("Thông báo mở kỳ đánh giá ĐRL " + semesterName, "Mở cổng đánh giá ĐRL hạn chót " + deadlineStr, content);
    }

    /**
     * Luồng 2.2: Phiếu rèn luyện bị TRẢ LẠI
     */
    public static String buildFormRejectedEmail(String fullName, String levelTitle, String rejectReason, String editUrl) {
        String content = "<h3 style=\"margin-top: 0; color: " + TEXT_MAIN + "; font-size: 16px;\">Kính gửi sinh viên " + escape(fullName) + ",</h3>\n" +
                "<p style=\"font-size: 14px; line-height: 1.6;\">Phiếu đánh giá Điểm Rèn Luyện của bạn đã bị <b>" + escape(levelTitle) + "</b> trả lại để yêu cầu chỉnh sửa và bổ sung thông tin.</p>\n" +
                "<div style=\"background-color: #fff1f2; border: 1px solid #fecdd3; border-radius: 8px; padding: 16px; margin: 16px 0;\">\n" +
                "  <div style=\"font-size: 13px; font-weight: bold; color: #9f1239; margin-bottom: 6px;\">Cấp trả lại: " + escape(levelTitle) + "</div>\n" +
                "  <div style=\"font-size: 14px; color: #881337;\"><b>Lý do trả lại chi tiết:</b><br/>\n" +
                "    <span style=\"white-space: pre-line; display: block; margin-top: 4px; padding: 8px; background: #ffffff; border-radius: 4px; border: 1px solid #fda4af;\">" + escape(rejectReason) + "</span>\n" +
                "  </div>\n" +
                "</div>\n" +
                "<div class=\"info-box\">\n" +
                "  ℹ️ <b>Thông báo thu hồi chữ ký số:</b> Chữ ký số trên bản nộp cũ đã được hệ thống thu hồi hợp lệ. Vui lòng kiểm tra lại điểm tự chấm và tài liệu minh chứng, sau đó ký xác nhận lại để nộp lại phiếu trước hạn quy định.\n" +
                "</div>\n" +
                "<div style=\"text-align: center; margin: 24px 0;\">\n" +
                "  <a href=\"" + escape(editUrl) + "\" class=\"btn\">Chỉnh sửa và Nộp lại phiếu</a>\n" +
                "</div>";

        return wrapHtml("Phiếu rèn luyện bị trả lại - Cần hoàn thiện lại", "Phiếu ĐRL của bạn bị " + levelTitle + " trả lại", content);
    }

    /**
     * Luồng 2.3: Công bố kết quả chính thức (DEAN_APPROVED)
     */
    public static String buildOfficialResultEmail(String fullName, String semesterName, BigDecimal finalScore, String ranking, String sha256Hash, String portalUrl) {
        String content = "<h3 style=\"margin-top: 0; color: " + TEXT_MAIN + "; font-size: 16px;\">Chúc mừng sinh viên " + escape(fullName) + ",</h3>\n" +
                "<p style=\"font-size: 14px; line-height: 1.6;\">Phiếu Điểm Rèn Luyện của bạn cho <b>" + escape(semesterName) + "</b> đã được Ban Chủ nhiệm Khoa phê duyệt chính thức và hoàn tất ký số đóng gói 3 cấp.</p>\n" +
                "<div style=\"background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 20px; margin: 16px 0; text-align: center;\">\n" +
                "  <div style=\"font-size: 13px; color: #065f46; text-transform: uppercase; font-weight: bold;\">Kết quả rèn luyện chính thức</div>\n" +
                "  <div style=\"font-size: 36px; font-weight: 900; color: #047857; margin: 8px 0;\">" + (finalScore != null ? finalScore.stripTrailingZeros().toPlainString() : "0") + " <span style=\"font-size: 18px;\">điểm</span></div>\n" +
                "  <div style=\"font-size: 15px; font-weight: bold; color: #065f46;\">Xếp loại: <span class=\"badge badge-emerald\" style=\"font-size: 13px;\">" + escape(ranking) + "</span></div>\n" +
                "</div>\n" +
                "<div class=\"info-box\">\n" +
                "  <b>Mã băm SHA-256 đối chiếu toàn vẹn (DocMDP P=1):</b><br/>\n" +
                "  <span style=\"font-family: monospace; font-size: 11px; word-break: break-all; color: #334155;\">" + escape(sha256Hash) + "</span>\n" +
                "  <p style=\"margin: 6px 0 0; font-size: 12px; color: " + TEXT_MUTED + ";\">Tệp PDF đính kèm email này đã được cấp chứng nhận niêm phong số DocMDP P=1 không thể sửa đổi.</p>\n" +
                "</div>\n" +
                "<div style=\"text-align: center; margin: 24px 0;\">\n" +
                "  <a href=\"" + escape(portalUrl) + "\" class=\"btn\">Xem chi tiết trên Portal</a>\n" +
                "</div>";

        return wrapHtml("Công bố kết quả Điểm Rèn Luyện chính thức - " + semesterName, "Kết quả chính thức: " + finalScore + " điểm (" + ranking + ")", content);
    }

    // ==========================================
    // NHÓM 3: DÀNH CHO CÁN BỘ LỚP
    // ==========================================

    /**
     * Luồng 3.1: Nhắc nhở hạn chót hoàn thành chấm điểm cấp Lớp
     */
    public static String buildClassLeaderReminderEmail(String leaderName, String className, List<String> pendingStudentNames, String reviewQueueUrl) {
        StringBuilder studentsListHtml = new StringBuilder("<ul style=\"margin: 8px 0; padding-left: 20px; font-size: 13px;\">");
        int count = 0;
        for (String s : pendingStudentNames) {
            studentsListHtml.append("<li>").append(escape(s)).append("</li>");
            count++;
            if (count >= 15 && pendingStudentNames.size() > 15) {
                studentsListHtml.append("<li><i>và ").append(pendingStudentNames.size() - 15).append(" sinh viên khác...</i></li>");
                break;
            }
        }
        studentsListHtml.append("</ul>");

        String content = "<h3 style=\"margin-top: 0; color: " + TEXT_MAIN + "; font-size: 16px;\">Kính gửi Cán bộ lớp " + escape(leaderName) + " (Lớp " + escape(className) + "),</h3>\n" +
                "<p style=\"font-size: 14px; line-height: 1.6;\">Thời hạn thẩm định Điểm Rèn Luyện cấp Lớp sắp kết thúc để chuyển giao dữ liệu thẩm định lên Khoa.</p>\n" +
                "<div style=\"background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 16px; margin: 16px 0;\">\n" +
                "  <div style=\"font-size: 13px; font-weight: bold; color: #b45309;\">Danh sách sinh viên trong lớp đang chờ thẩm định (" + pendingStudentNames.size() + " sinh viên):</div>\n" +
                studentsListHtml +
                "</div>\n" +
                "<p style=\"font-size: 13px;\">Đề nghị Ban cán sự lớp khẩn trương hoàn thành việc chấm điểm, ký duyệt và chuyển toàn bộ phiếu lên Ban Chủ nhiệm Khoa đúng hạn.</p>\n" +
                "<div style=\"text-align: center; margin: 24px 0;\">\n" +
                "  <a href=\"" + escape(reviewQueueUrl) + "\" class=\"btn\">Vào Hàng đợi Thẩm định Lớp</a>\n" +
                "</div>";

        return wrapHtml("Nhắc nhở hạn chót thẩm định ĐRL cấp Lớp - " + className, "Lớp còn " + pendingStudentNames.size() + " sinh viên chưa thẩm định", content);
    }

    /**
     * Luồng 3.2: Thông báo Khoa trả lại phiếu thuộc thẩm quyền của Lớp
     */
    public static String buildClassLeaderFormRejectedNoticeEmail(String leaderName, String className, String studentName, String studentCode, String reason, String queueUrl) {
        String content = "<h3 style=\"margin-top: 0; color: " + TEXT_MAIN + "; font-size: 16px;\">Kính gửi Cán bộ lớp " + escape(leaderName) + " (Lớp " + escape(className) + "),</h3>\n" +
                "<p style=\"font-size: 14px; line-height: 1.6;\">Phiếu rèn luyện của sinh viên <b>" + escape(studentName) + "</b> (Mã SV: " + escape(studentCode) + ") đã được Lớp thông qua nhưng vừa bị <b>Ban Chủ nhiệm Khoa trả lại</b>.</p>\n" +
                "<div style=\"background-color: #fff1f2; border: 1px solid #fecdd3; border-radius: 8px; padding: 16px; margin: 16px 0;\">\n" +
                "  <div style=\"font-size: 13px; font-weight: bold; color: #9f1239; margin-bottom: 6px;\">Ý kiến phản hồi từ Ban Chủ nhiệm Khoa:</div>\n" +
                "  <div style=\"font-size: 14px; color: #881337; padding: 8px; background: #ffffff; border-radius: 4px; border: 1px solid #fda4af;\">\n" +
                "    " + escape(reason) + "\n" +
                "  </div>\n" +
                "</div>\n" +
                "<p style=\"font-size: 13px; line-height: 1.6; color: " + TEXT_MUTED + ";\">Thông báo này giúp Ban cán sự lớp nắm được lý do và rút kinh nghiệm cho các lần thẩm định hồ sơ tiếp theo. Sinh viên đã nhận được thông báo để chỉnh sửa lại phiếu.</p>\n" +
                "<div style=\"text-align: center; margin: 20px 0;\">\n" +
                "  <a href=\"" + escape(queueUrl) + "\" class=\"btn\">Xem hàng đợi lớp</a>\n" +
                "</div>";

        return wrapHtml("Khoa trả lại phiếu ĐRL của sinh viên " + studentName, "Khoa trả lại phiếu của SV " + studentName + " (" + studentCode + ")", content);
    }

    // ==========================================
    // NHÓM 4: DÀNH CHO BAN CHỦ NHIỆM KHOA
    // ==========================================

    /**
     * Luồng 4.1: Nhắc nhở hạn chót hoàn thành chấm điểm cấp Khoa
     */
    public static String buildDeanReminderEmail(String deanName, String deptName, int pendingCount, String batchUrl) {
        String content = "<h3 style=\"margin-top: 0; color: " + TEXT_MAIN + "; font-size: 16px;\">Kính gửi Thầy/Cô " + escape(deanName) + " (" + escape(deptName) + "),</h3>\n" +
                "<p style=\"font-size: 14px; line-height: 1.6;\">Hệ thống xin thông báo nhắc nhở về tiến độ phê duyệt Điểm Rèn Luyện cấp Khoa trước thời điểm đóng kỳ chấm toàn trường.</p>\n" +
                "<div style=\"background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 16px; margin: 16px 0;\">\n" +
                "  <div style=\"font-size: 14px; color: #b45309;\">Hiện tại, " + escape(deptName) + " còn <b>" + pendingCount + " phiếu ĐRL</b> đã được các Lớp thông qua và đang chờ Ban Chủ nhiệm Khoa hoàn tất phê duyệt / ký số lô.</div>\n" +
                "</div>\n" +
                "<p style=\"font-size: 13px; line-height: 1.6;\">Kính đề nghị Thầy/Cô vào hệ thống để kiểm tra và thực hiện phê duyệt theo lô trước hạn đóng cổng cấp trường.</p>\n" +
                "<div style=\"text-align: center; margin: 24px 0;\">\n" +
                "  <a href=\"" + escape(batchUrl) + "\" class=\"btn\">Vào trang Duyệt lô cấp Khoa</a>\n" +
                "</div>";

        return wrapHtml("Nhắc nhở hạn chót phê duyệt ĐRL cấp Khoa - " + deptName, "Khoa còn " + pendingCount + " phiếu ĐRL chờ duyệt", content);
    }
}
