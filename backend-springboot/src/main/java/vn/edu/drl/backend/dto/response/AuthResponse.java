package vn.edu.drl.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private String token;
    private String role;
    private Boolean isFirstLogin;
    private Boolean mustChangePassword;

    public AuthResponse(String token, String role) {
        this.token = token;
        this.role = role;
        this.isFirstLogin = false;
        this.mustChangePassword = false;
    }
}
