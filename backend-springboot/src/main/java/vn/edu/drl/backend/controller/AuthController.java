package vn.edu.drl.backend.controller;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.edu.drl.backend.Wrapper.ApiResponse;
import vn.edu.drl.backend.dto.request.ChangePasswordRequest;
import vn.edu.drl.backend.dto.request.LoginRequest;
import vn.edu.drl.backend.dto.response.AuthResponse;
import vn.edu.drl.backend.security.SecurityUtils;
import vn.edu.drl.backend.service.AuthService;

import java.util.Map;
import java.util.NoSuchElementException;

@RestController
@RequestMapping({"/api/v1/auth", "/api/auth"})
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
            String msg = ex.getMessage();
            if (msg != null && (msg.startsWith("ACCOUNT_DISABLED") || msg.contains("vô hiệu hóa"))) {
                return ApiResponse.error("ACCOUNT_DISABLED", "Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên.");
            }
            if (msg != null && (msg.startsWith("FORBIDDEN") || msg.contains("bị khóa"))) {
                return ApiResponse.error("FORBIDDEN", "Tài khoản đã bị vô hiệu hóa hoặc bị khóa.");
            }
            return ApiResponse.error("UNAUTHORIZED", "Sai email hoặc mật khẩu");
        }
    }

    @GetMapping("/me")
    public ApiResponse<vn.edu.drl.backend.dto.response.AuthUserResponse> me() {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        if (currentUserId == null) {
            throw new RuntimeException("UNAUTHORIZED");
        }
        return ApiResponse.success(authService.me(currentUserId));
    }

    @PutMapping("/change-password")
    public ResponseEntity<ApiResponse<Map<String, Object>>> changePassword(@RequestBody(required = false) ChangePasswordRequest request) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        if (currentUserId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("UNAUTHORIZED", "Vui lòng đăng nhập để thực hiện thao tác này"));
        }

        try {
            authService.changePassword(currentUserId, request);
            ApiResponse<Map<String, Object>> response = ApiResponse.<Map<String, Object>>builder()
                    .success(true)
                    .code("OK")
                    .message("Đổi mật khẩu thành công")
                    .data(Map.of("success", true, "message", "Đổi mật khẩu thành công"))
                    .build();
            return ResponseEntity.ok(response);
        } catch (NoSuchElementException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("NOT_FOUND", ex.getMessage()));
        } catch (SecurityException ex) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("FORBIDDEN", ex.getMessage()));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("BAD_REQUEST", ex.getMessage()));
        }
    }
}
