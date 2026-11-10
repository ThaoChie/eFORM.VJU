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
            .build();
    }
}
