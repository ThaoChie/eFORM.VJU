package vn.edu.drl.backend.dto.response;

import lombok.Data;
import lombok.NoArgsConstructor;
import vn.edu.drl.backend.enu.Role;
import vn.edu.drl.backend.model.ClassEntity;
import vn.edu.drl.backend.model.Department;
import vn.edu.drl.backend.model.User;

import java.time.Instant;

@Data
@NoArgsConstructor
public class UserResponse {
    private Long id;
    private String userCode;
    private String fullName;
    private String email;
    private Role role;
    private Integer status;
    private String positionTitle;
    private String academicCohort;
    private Boolean isSigner;
    private String signatureSpecimenUrl;
    private String signatureHash;
    private Instant signatureRegisteredAt;
    private Boolean isSignatureLocked;
    private Boolean isActive;
    private Instant createdAt;

    private Long deptId;
    private String deptCode;
    private String deptName;

    private Long classId;
    private String classCode;
    private String className;

    private DepartmentDto department;
    private ClassDto classEntity;

    @Data
    @NoArgsConstructor
    public static class DepartmentDto {
        private Long id;
        private String deptCode;
        private String deptName;
        private Integer status;

        public DepartmentDto(Department d) {
            if (d != null) {
                this.id = d.getId();
                this.deptCode = d.getDeptCode();
                this.deptName = d.getDeptName();
                this.status = d.getStatus();
            }
        }
    }

    @Data
    @NoArgsConstructor
    public static class ClassDto {
        private Long id;
        private String classCode;
        private String className;
        private String academicCohort;
        private Integer status;

        public ClassDto(ClassEntity c) {
            if (c != null) {
                this.id = c.getId();
                this.classCode = c.getClassCode();
                this.className = c.getClassName();
                this.academicCohort = c.getAcademicCohort();
                this.status = c.getStatus();
            }
        }
    }

    public UserResponse(User user) {
        if (user == null) return;
        this.id = user.getId();
        this.userCode = user.getUserCode();
        this.fullName = user.getFullName();
        this.email = user.getEmail();
        this.role = user.getRole();
        this.status = user.getStatus();
        this.positionTitle = user.getPositionTitle();
        this.academicCohort = user.getAcademicCohort();
        this.isSigner = user.getIsSigner();
        this.signatureSpecimenUrl = user.getSignatureSpecimenUrl();
        this.signatureHash = user.getSignatureHash();
        this.signatureRegisteredAt = user.getSignatureRegisteredAt();
        this.isSignatureLocked = user.getIsSignatureLocked();
        this.isActive = user.getIsActive();
        this.createdAt = user.getCreatedAt();

        try {
            if (user.getDepartment() != null) {
                Department d = user.getDepartment();
                this.deptId = d.getId();
                this.deptCode = d.getDeptCode();
                this.deptName = d.getDeptName();
                this.department = new DepartmentDto(d);
            }
        } catch (Exception ignored) {}

        try {
            if (user.getClassEntity() != null) {
                ClassEntity c = user.getClassEntity();
                this.classId = c.getId();
                this.classCode = c.getClassCode();
                this.className = c.getClassName();
                this.classEntity = new ClassDto(c);
                if (this.deptId == null && c.getDepartment() != null) {
                    Department d = c.getDepartment();
                    this.deptId = d.getId();
                    this.deptCode = d.getDeptCode();
                    this.deptName = d.getDeptName();
                    this.department = new DepartmentDto(d);
                }
                if ((this.academicCohort == null || this.academicCohort.trim().isEmpty()) && c.getAcademicCohort() != null) {
                    this.academicCohort = c.getAcademicCohort();
                }
            }
        } catch (Exception ignored) {}
    }
}
