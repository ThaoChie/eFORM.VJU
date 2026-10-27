package vn.edu.drl.backend.service.impl;

import vn.edu.drl.backend.service.AuthService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import vn.edu.drl.backend.dao.UserRepository;
import vn.edu.drl.backend.dto.request.LoginRequest;
import vn.edu.drl.backend.dto.response.AuthResponse;
import vn.edu.drl.backend.model.User;
import vn.edu.drl.backend.security.JwtUtil;
import org.springframework.transaction.annotation.Transactional;

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
        return new AuthResponse(token, user.getRole().name());
    }

    public vn.edu.drl.backend.dto.response.AuthUserResponse me(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("USER_NOT_FOUND"));
        
        boolean isUserDisabled = (user.getStatus() != null && user.getStatus() == 0)
                || Boolean.FALSE.equals(user.getIsActive());
        if (isUserDisabled) {
            throw new RuntimeException("ACCOUNT_DISABLED: Tài khoản của bạn đã bị vô hiệu hóa.");
        }
        
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
            .build();
    }
}
