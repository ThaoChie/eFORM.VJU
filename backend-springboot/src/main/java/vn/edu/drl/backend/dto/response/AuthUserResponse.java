package vn.edu.drl.backend.dto.response;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AuthUserResponse {
    private Long id;
    private String userID;
    private String fullName;
    private String email;
    private String role;
    private String facultyName;
    private String className;
}
