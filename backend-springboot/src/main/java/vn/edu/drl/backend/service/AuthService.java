package vn.edu.drl.backend.service;

import vn.edu.drl.backend.dto.request.ChangePasswordRequest;
import vn.edu.drl.backend.dto.request.LoginRequest;
import vn.edu.drl.backend.dto.response.AuthResponse;
import vn.edu.drl.backend.dto.response.AuthUserResponse;

public interface AuthService {
    AuthResponse login(LoginRequest request);
    AuthUserResponse me(Long userId);
    void changePassword(Long userId, ChangePasswordRequest request);
}
