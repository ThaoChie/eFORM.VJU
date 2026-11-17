package vn.edu.drl.backend.service.impl;

import vn.edu.drl.backend.service.AuthService;
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

    public AuthServiceImpl(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
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
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
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
        
        boolean firstLogin = Boolean.TRUE.equals(user.getIsFirstLogin()) || Boolean.TRUE.equals(user.getMustChangePassword());

        return vn.edu.drl.backend.dto.response.AuthUserResponse.builder()
            .id(user.getId())
            .userID(user.getUserCode())
            .fullName(user.getFullName())
            .email(user.getEmail())
            .role(user.getRole().name())
            .facultyName(user.getDepartment() != null ? user.getDepartment().getDeptName() : null)
            .className(user.getClassEntity() != null ? user.getClassEntity().getClassName() : null)
            .signatureSpecimenUrl(user.getSignatureSpecimenUrl())
            .signatureHash(user.getSignatureHash())
            .signatureRegisteredAt(user.getSignatureRegisteredAt())
            .isSignatureLocked(Boolean.TRUE.equals(user.getIsSignatureLocked()))
            .isFirstLogin(firstLogin)
            .mustChangePassword(firstLogin)
            .build();
    }
}
