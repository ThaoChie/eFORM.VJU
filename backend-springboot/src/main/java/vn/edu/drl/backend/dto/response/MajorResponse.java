package vn.edu.drl.backend.dto.response;

import lombok.Data;
import vn.edu.drl.backend.model.Major;
import java.time.Instant;

@Data
public class MajorResponse {
    private Long id;
    private String majorCode;
    private String majorName;
    private Long deptId;
    private String deptCode;
    private String deptName;
    private Integer status;
    private Instant createdAt;

    public MajorResponse() {}

    public MajorResponse(Major m) {
        this.id = m.getId();
        this.majorCode = m.getMajorCode();
        this.majorName = m.getMajorName();
        this.status = m.getStatus();
        this.createdAt = m.getCreatedAt();
        if (m.getDepartment() != null) {
            this.deptId = m.getDepartment().getId();
            this.deptCode = m.getDepartment().getDeptCode();
            this.deptName = m.getDepartment().getDeptName();
        }
    }
}
