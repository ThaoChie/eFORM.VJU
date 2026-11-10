package vn.edu.drl.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class MajorRequest {
    @NotBlank(message = "Mã ngành không được để trống")
    private String majorCode;

    @NotBlank(message = "Tên ngành không được để trống")
    private String majorName;

    @NotNull(message = "Vui lòng chọn khoa trực thuộc")
    private Long deptId;

    private Integer status;
}
