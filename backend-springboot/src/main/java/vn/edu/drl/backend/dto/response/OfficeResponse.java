package vn.edu.drl.backend.dto.response;

import lombok.Data;
import vn.edu.drl.backend.model.Office;
import java.time.Instant;

@Data
public class OfficeResponse {
    private Long id;
    private String officeCode;
    private String officeName;
    private Integer status;
    private Instant createdAt;
    private String headName;
    private Long headId;

    public OfficeResponse(Office o, String headName, Long headId) {
        this.id = o.getId();
        this.officeCode = o.getOfficeCode();
        this.officeName = o.getOfficeName();
        this.status = o.getStatus();
        this.createdAt = o.getCreatedAt();
        this.headName = headName;
        this.headId = headId;
    }
}
