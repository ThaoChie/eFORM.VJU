package vn.edu.drl.backend.dto.response;

import lombok.Data;
import vn.edu.drl.backend.model.Department;
import java.time.Instant;

@Data
public class DepartmentResponse {
    private Long id;
    private String deptCode;
    private String deptName;
    private Integer status;
    private Instant createdAt;
    private long classesCount;
    private long usersCount;
    private String deanName;
    private Long deanId;
    
    public DepartmentResponse(Department d, long classesCount, long usersCount, String deanName, Long deanId) {
        this.id = d.getId();
        this.deptCode = d.getDeptCode();
        this.deptName = d.getDeptName();
        this.status = d.getStatus();
        this.createdAt = d.getCreatedAt();
        this.classesCount = classesCount;
        this.usersCount = usersCount;
        this.deanName = deanName;
        this.deanId = deanId;
    }
}
