package vn.edu.drl.backend.dto.request;

import lombok.Data;

@Data
public class OfficeRequest {
    private String officeCode;
    private String officeName;
    private Integer status;
    private Long headId;
}
