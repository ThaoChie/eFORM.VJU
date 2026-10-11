package vn.edu.drl.backend.controller;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import vn.edu.drl.backend.Wrapper.ApiResponse;
import vn.edu.drl.backend.dto.request.LoginRequest;
import vn.edu.drl.backend.dto.response.AuthResponse;
import vn.edu.drl.backend.service.AuthService;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ApiResponse<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        try {
            return ApiResponse.success(authService.login(request));
        } catch (RuntimeException ex) {
            ex.printStackTrace();
            return ApiResponse.error("UNAUTHORIZED", "Sai email hoặc mật khẩu");
        }
    }

    @GetMapping("/me")
    public ApiResponse<vn.edu.drl.backend.dto.response.AuthUserResponse> me() {
        Long currentUserId = vn.edu.drl.backend.security.SecurityUtils.getCurrentUserId();
        if (currentUserId == null) {
            throw new RuntimeException("UNAUTHORIZED");
        }
        return ApiResponse.success(authService.me(currentUserId));
    }
}
