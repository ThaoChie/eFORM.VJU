package vn.edu.drl.backend.service;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import vn.edu.drl.backend.dao.UserRepository;
import vn.edu.drl.backend.dto.request.LoginRequest;
import vn.edu.drl.backend.dto.response.AuthResponse;
import vn.edu.drl.backend.model.User;
import vn.edu.drl.backend.security.JwtUtil;

import vn.edu.drl.backend.dto.response.AuthUserResponse;

public interface AuthService {
    AuthResponse login(LoginRequest request);
    AuthUserResponse me(Long userId);
}
