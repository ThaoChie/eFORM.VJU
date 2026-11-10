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
    private java.time.LocalDate dob;
    private String facultyName;
    private String departmentName;
    private String className;
    private String classCode;
    private String majorName;
    private String academicCohort;
    private String signatureSpecimenUrl;
    private String signatureHash;
    private java.time.Instant signatureRegisteredAt;
    private Boolean isSignatureLocked;
}
