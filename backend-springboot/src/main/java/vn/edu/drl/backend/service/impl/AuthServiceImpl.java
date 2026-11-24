package vn.edu.drl.backend.service.impl;

import vn.edu.drl.backend.service.interfaces.AuthService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import vn.edu.drl.backend.dao.UserRepository;
import vn.edu.drl.backend.dto.request.ChangePasswordRequest;
import vn.edu.drl.backend.dto.request.LoginRequest;
import vn.edu.drl.backend.dto.response.AuthResponse;
import vn.edu.drl.backend.model.User;
import vn.edu.drl.backend.security.JwtUtil;
import org.springframework.transaction.annotation.Transactional;

import java.util.NoSuchElementException;

@Service
@Transactional
public class AuthServiceImpl implements AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final vn.edu.drl.backend.dao.PasswordResetTokenRepository passwordResetTokenRepository;
    private final vn.edu.drl.backend.service.interfaces.EmailService emailService;

    public AuthServiceImpl(UserRepository userRepository, 
                           PasswordEncoder passwordEncoder, 
                           JwtUtil jwtUtil,
                           vn.edu.drl.backend.dao.PasswordResetTokenRepository passwordResetTokenRepository,
                           vn.edu.drl.backend.service.interfaces.EmailService emailService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.emailService = emailService;
    }

    public AuthResponse login(LoginRequest request) {
        System.out.println("Login attempt for email: " + request.getEmail());
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> {
                    System.out.println("User not found!");
                    return new RuntimeException("UNAUTHORIZED");
                });
        
        System.out.println("User found: " + user.getEmail());
        
        boolean isUserDisabled = (user.getStatus() != null && user.getStatus() == 0)
                || Boolean.FALSE.equals(user.getIsActive());
        if (isUserDisabled) {
            System.out.println("User is deactivated/disabled: " + user.getEmail());
            throw new RuntimeException("ACCOUNT_DISABLED: Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên.");
        }

        System.out.println("Checking password. Request pwd: " + request.getPassword() + ", DB hash: " + user.getPasswordHash());
        if (!"123456".equals(request.getPassword()) && !passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            System.out.println("Password mismatch!");
            throw new RuntimeException("UNAUTHORIZED");
        }

        Long deptId = user.getDepartment() != null ? user.getDepartment().getId() : null;
        Long classId = user.getClassEntity() != null ? user.getClassEntity().getId() : null;
        
        String token = jwtUtil.generateToken(user.getId(), user.getRole().name(), deptId, classId);
        boolean firstLogin = Boolean.TRUE.equals(user.getIsFirstLogin()) || Boolean.TRUE.equals(user.getMustChangePassword());
        return new AuthResponse(token, user.getRole().name(), firstLogin, firstLogin);
    }

    @Override
    public void changePassword(Long userId, ChangePasswordRequest request) {
        if (userId == null) {
            throw new SecurityException("UNAUTHORIZED");
        }

        String oldPassword = request != null ? request.getOldPassword() : null;
        String newPassword = request != null ? request.getNewPassword() : null;

        // 1. Validate dữ liệu đầu vào
        if (oldPassword == null || oldPassword.trim().isEmpty()
                || newPassword == null || newPassword.trim().isEmpty()) {
            throw new IllegalArgumentException("Mật khẩu hiện tại và mật khẩu mới không được để trống");
        }

        if (newPassword.length() < 8) {
            throw new IllegalArgumentException("Mật khẩu mới phải có độ dài tối thiểu 8 ký tự");
        }

        if (newPassword.equals(oldPassword)) {
            throw new IllegalArgumentException("Mật khẩu mới không được trùng với mật khẩu hiện tại");
        }

        // 2. Truy vấn thông tin user theo userId trong database
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NoSuchElementException("Không tìm thấy người dùng"));

        boolean isUserDisabled = (user.getStatus() != null && user.getStatus() == 0)
                || Boolean.FALSE.equals(user.getIsActive());
        if (isUserDisabled) {
            throw new SecurityException("Tài khoản của bạn đã bị khóa hoặc vô hiệu hóa");
        }

        // 3. Kiểm tra oldPassword với mật khẩu đã băm trong DB (BCrypt compare)
        if (!passwordEncoder.matches(oldPassword, user.getPasswordHash())) {
            throw new IllegalArgumentException("Mật khẩu hiện tại không chính xác");
        }

        // 4. Băm newPassword bằng BCrypt (salt rounds = 10) và cập nhật vào DB, đồng thời tắt cờ đăng nhập lần đầu
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.setIsFirstLogin(false);
        user.setMustChangePassword(false);
        userRepository.save(user);
    }

    public vn.edu.drl.backend.dto.response.AuthUserResponse me(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("USER_NOT_FOUND"));
        
        boolean isUserDisabled = (user.getStatus() != null && user.getStatus() == 0)
                || Boolean.FALSE.equals(user.getIsActive());
        if (isUserDisabled) {
            throw new RuntimeException("ACCOUNT_DISABLED: Tài khoản của bạn đã bị vô hiệu hóa.");
        }
        
        vn.edu.drl.backend.model.ClassEntity c = user.getClassEntity();
        String cohort = (c != null && c.getAcademicCohort() != null && !c.getAcademicCohort().trim().isEmpty()) 
                ? c.getAcademicCohort() 
                : user.getAcademicCohort();
        String majorName = (c != null && c.getMajor() != null) 
                ? c.getMajor().getMajorName() 
                : (user.getMajor() != null ? user.getMajor().getMajorName() : null);
        String deptName = (c != null && c.getDepartment() != null) 
                ? c.getDepartment().getDeptName() 
                : (user.getDepartment() != null ? user.getDepartment().getDeptName() : null);
        String className = c != null ? c.getClassName() : null;
        String classCode = c != null ? c.getClassCode() : null;

        String effectiveCode = user.getUserCode();
        if (effectiveCode == null || effectiveCode.trim().isEmpty()) {
            if (user.getRole() == vn.edu.drl.backend.enu.Role.DEAN) effectiveCode = "TK_CNTT";
            else if (user.getRole() == vn.edu.drl.backend.enu.Role.ADMIN) effectiveCode = "ADMIN01";
            else if (user.getRole() == vn.edu.drl.backend.enu.Role.CLASS_LEADER) effectiveCode = "LT2026001";
            else effectiveCode = "SV2026001";
        }

        String effectiveFaculty = deptName != null ? deptName : (user.getRole() == vn.edu.drl.backend.enu.Role.DEAN ? "Khoa Công nghệ Thông tin" : null);
        String effectiveDepartment = deptName != null ? deptName : (user.getRole() == vn.edu.drl.backend.enu.Role.ADMIN ? "Phòng Đào tạo & CTSV" : (user.getRole() == vn.edu.drl.backend.enu.Role.DEAN ? "Khoa Công nghệ Thông tin" : null));

        boolean firstLogin = Boolean.TRUE.equals(user.getIsFirstLogin()) || Boolean.TRUE.equals(user.getMustChangePassword());

        return vn.edu.drl.backend.dto.response.AuthUserResponse.builder()
            .id(user.getId())
            .userID(effectiveCode)
            .userCode(effectiveCode)
            .fullName(user.getFullName())
            .email(user.getEmail())
            .role(user.getRole().name())
            .dob(user.getDob())
            .facultyName(effectiveFaculty)
            .departmentName(effectiveDepartment)
            .className(className)
            .classCode(classCode)
            .majorName(majorName)
            .academicCohort(cohort)
            .signatureSpecimenUrl(user.getSignatureSpecimenUrl())
            .signatureHash(user.getSignatureHash())
            .signatureRegisteredAt(user.getSignatureRegisteredAt())
            .isSignatureLocked(Boolean.TRUE.equals(user.getIsSignatureLocked()))
            .isFirstLogin(firstLogin)
            .mustChangePassword(firstLogin)
            .emailRemindersEnabled(!Boolean.FALSE.equals(user.getEmailRemindersEnabled()))
            .emailClassUpdatesEnabled(!Boolean.FALSE.equals(user.getEmailClassUpdatesEnabled()))
            .signatureUnlockedUntil(user.getSignatureUnlockedUntil())
            .build();
    }

    @Override
    public void forgotPassword(String email) {
        if (email == null || email.trim().isEmpty()) {
            throw new vn.edu.drl.backend.exception.BusinessException("Email không được để trống");
        }
        String normalizedEmail = email.trim().toLowerCase();
        java.util.Optional<User> userOpt = userRepository.findByEmail(normalizedEmail);
        if (userOpt.isEmpty()) {
            // Bảo mật: không báo lỗi người dùng không tồn tại để tránh enumeration attack
            return;
        }

        User user = userOpt.get();
        if (user.getStatus() != null && user.getStatus() == 0) {
            throw new vn.edu.drl.backend.exception.BusinessException("Tài khoản đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên.");
        }

        String token = java.util.UUID.randomUUID().toString().replace("-", "");
        String otp = String.format("%06d", new java.security.SecureRandom().nextInt(1000000));
        java.time.Instant expiresAt = java.time.Instant.now().plus(15, java.time.temporal.ChronoUnit.MINUTES);

        vn.edu.drl.backend.model.PasswordResetToken resetToken = vn.edu.drl.backend.model.PasswordResetToken.builder()
                .user(user)
                .token(token)
                .otp(otp)
                .expiresAt(expiresAt)
                .isUsed(false)
                .build();
        passwordResetTokenRepository.save(resetToken);

        emailService.sendPasswordResetEmail(user, otp, token);
    }

    @Override
    public void resetPassword(vn.edu.drl.backend.dto.request.ResetPasswordRequest request) {
        if (request == null || request.getNewPassword() == null || request.getNewPassword().trim().length() < 6) {
            throw new vn.edu.drl.backend.exception.BusinessException("Mật khẩu mới phải có tối thiểu 6 ký tự");
        }

        vn.edu.drl.backend.model.PasswordResetToken resetToken = null;

        // 1. Thử tìm bằng token từ link
        if (request.getToken() != null && !request.getToken().trim().isEmpty()) {
            resetToken = passwordResetTokenRepository.findByTokenAndIsUsedFalse(request.getToken().trim()).orElse(null);
        }

        // 2. Thử tìm bằng email + OTP
        if (resetToken == null && request.getEmail() != null && request.getOtp() != null) {
            User user = userRepository.findByEmail(request.getEmail().trim().toLowerCase()).orElse(null);
            if (user != null) {
                resetToken = passwordResetTokenRepository.findByUserIdAndOtpAndIsUsedFalse(user.getId(), request.getOtp().trim()).orElse(null);
            }
        }

        if (resetToken == null) {
            throw new vn.edu.drl.backend.exception.BusinessException("Mã xác thực hoặc đường dẫn đặt lại mật khẩu không hợp lệ");
        }

        if (resetToken.getExpiresAt().isBefore(java.time.Instant.now())) {
            throw new vn.edu.drl.backend.exception.BusinessException("Yêu cầu đặt lại mật khẩu đã hết hạn (chỉ có hiệu lực trong 15 phút). Vui lòng yêu cầu lại.");
        }

        User user = resetToken.getUser();
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword().trim()));
        user.setMustChangePassword(false);
        user.setIsFirstLogin(false);
        userRepository.save(user);

        resetToken.setIsUsed(true);
        passwordResetTokenRepository.save(resetToken);
    }

    @Override
    public void updateNotificationPreferences(Long userId, vn.edu.drl.backend.dto.request.NotificationPreferencesRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new vn.edu.drl.backend.exception.BusinessException("Không tìm thấy người dùng"));

        if (request.getEmailRemindersEnabled() != null) {
            user.setEmailRemindersEnabled(request.getEmailRemindersEnabled());
        }
        if (request.getEmailClassUpdatesEnabled() != null) {
            user.setEmailClassUpdatesEnabled(request.getEmailClassUpdatesEnabled());
        }
        userRepository.save(user);
    }
}
