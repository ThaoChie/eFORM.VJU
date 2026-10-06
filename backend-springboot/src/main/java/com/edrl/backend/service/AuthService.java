package com.edrl.backend.service;

import com.edrl.backend.dao.UserRepository;
import com.edrl.backend.dto.request.ChangePwdReq;
import com.edrl.backend.dto.request.LoginReq;
import com.edrl.backend.dto.response.JwtRes;
import com.edrl.backend.dto.response.UserRes;
import com.edrl.backend.exception.AppException;
import com.edrl.backend.model.User;
import com.edrl.backend.security.JwtUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;

    @Transactional(readOnly = true)
    public JwtRes authenticateUser(LoginReq req) {
        User user = userRepository.findByEmail(req.getEmail())
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Không tìm thấy người dùng với email này"));

        if (!passwordEncoder.matches(req.getPassword(), user.getPasswordHash())) {
            throw new AppException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "Mật khẩu không chính xác");
        }

        if (Boolean.FALSE.equals(user.getIsActive())) {
            throw new AppException(HttpStatus.FORBIDDEN, "FORBIDDEN", "Tài khoản của bạn đã bị khóa");
        }

        String token = jwtUtils.generateJwtToken(user);

        return JwtRes.builder()
                .token(token)
                .role(user.getRole().name())
                .fullName(user.getFullName())
                .build();
    }

    @Transactional(readOnly = true)
    public UserRes getUserProfile(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Không tìm thấy người dùng"));
        return mapToUserRes(user);
    }

    @Transactional
    public void changePassword(String email, ChangePwdReq req) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Không tìm thấy người dùng"));

        if (!passwordEncoder.matches(req.getOldPassword(), user.getPasswordHash())) {
            throw new AppException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Mật khẩu cũ không chính xác");
        }

        user.setPasswordHash(passwordEncoder.encode(req.getNewPassword()));
        userRepository.save(user);
    }

    private UserRes mapToUserRes(User user) {
        return UserRes.builder()
                .id(user.getId())
                .userCode(user.getUserCode())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole())
                .deptId(user.getDeptId())
                .classId(user.getClassId())
                .isSigner(user.getIsSigner())
                .isActive(user.getIsActive())
                .build();
    }
}