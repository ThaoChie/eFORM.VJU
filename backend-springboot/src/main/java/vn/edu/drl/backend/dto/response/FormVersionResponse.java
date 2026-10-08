package vn.edu.drl.backend.dto.response;

import lombok.Data;
import vn.edu.drl.backend.enu.FormVersionStatus;
import java.time.Instant;

@Data
public class FormVersionResponse {
    private Long id;
    private String formCode;
    private String formName;
    private String versionNo;
    private Long semesterId;
    private String templateLayoutJson;
    private FormVersionStatus status;
    private Instant createdAt;
}
