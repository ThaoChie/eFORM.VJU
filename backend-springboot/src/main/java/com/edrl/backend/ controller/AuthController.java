package com.edrl.backend.controller;

import com.edrl.backend.Wrapper.ApiResponse;
import com.edrl.backend.dto.request.ChangePwdReq;
import com.edrl.backend.dto.request.LoginReq;
import com.edrl.backend.dto.response.JwtRes;
import com.edrl.backend.dto.response.UserRes;
import com.edrl.backend.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /**
     * API Đăng nhập
     * Bất kỳ ai cũng có thể gọi (Public)
     */
    @PostMapping("/login")
    public ApiResponse<JwtRes> login(@Valid @RequestBody LoginReq request) {
        JwtRes tokenResponse = authService.authenticateUser(request);
        return ApiResponse.ok(tokenResponse, "Đăng nhập thành công");
    }

    /**
     * API Lấy thông tin người dùng hiện tại (Profile)
     * Yêu cầu: Đã đăng nhập (Có JWT Token hợp lệ)
     */
    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<UserRes> getCurrentProfile(Authentication authentication) {
        // authentication.getName() sẽ trả về email hoặc userCode tuỳ cách bạn setup UserDetails
        String email = authentication.getName();
        UserRes userProfile = authService.getUserProfile(email);
        return ApiResponse.ok(userProfile);
    }

    /**
     * API Đổi mật khẩu
     * Yêu cầu: Đã đăng nhập (Có JWT Token hợp lệ)
     */
    @PostMapping("/change-password")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<String> changePassword(
            Authentication authentication,
            @Valid @RequestBody ChangePwdReq request) {
        
        String email = authentication.getName();
        authService.changePassword(email, request);
        
        return ApiResponse.ok("Đã đổi mật khẩu thành công");
    }
}