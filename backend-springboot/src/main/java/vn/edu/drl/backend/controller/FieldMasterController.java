package vn.edu.drl.backend.controller;

import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import vn.edu.drl.backend.Wrapper.ApiResponse;
import vn.edu.drl.backend.Wrapper.PageWrapper;
import vn.edu.drl.backend.dto.request.FieldMasterRequest;
import vn.edu.drl.backend.dto.response.FieldMasterResponse;
import vn.edu.drl.backend.service.FieldMasterService;

@RestController
@RequestMapping("/api/v1/fields")
public class FieldMasterController {

    private final FieldMasterService fieldMasterService;

    public FieldMasterController(FieldMasterService fieldMasterService) {
        this.fieldMasterService = fieldMasterService;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('ADMIN')")
    public ApiResponse<PageWrapper<FieldMasterResponse>> getFields(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<FieldMasterResponse> pageResult = fieldMasterService.getAllFields(PageRequest.of(page, size));
        return ApiResponse.success(new PageWrapper<>(pageResult));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ADMIN')")
    public ApiResponse<FieldMasterResponse> createField(@Valid @RequestBody FieldMasterRequest request) {
        return ApiResponse.success(fieldMasterService.createField(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ApiResponse<FieldMasterResponse> updateField(
            @PathVariable Long id, 
            @Valid @RequestBody FieldMasterRequest request) {
        try {
            return ApiResponse.success(fieldMasterService.updateField(id, request));
        } catch (RuntimeException ex) {
            String msg = ex.getMessage();
            if (msg.startsWith("VALIDATION_ERROR")) return ApiResponse.error("VALIDATION_ERROR", msg);
            if (msg.startsWith("FORM_LOCKED")) return ApiResponse.error("FORM_LOCKED", "Không thể sửa field_code đã được sử dụng");
            if (msg.startsWith("DUPLICATE")) return ApiResponse.error("DUPLICATE", "Mã field_code đã tồn tại");
            if (msg.startsWith("NOT_FOUND")) return ApiResponse.error("NOT_FOUND", "Không tìm thấy dữ liệu");
            throw ex;
        }
    }

    @PatchMapping("/{id}/toggle-status")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ApiResponse<FieldMasterResponse> toggleStatus(@PathVariable Long id) {
        try {
            return ApiResponse.success(fieldMasterService.toggleStatus(id));
        } catch (RuntimeException ex) {
            if (ex.getMessage().equals("NOT_FOUND")) return ApiResponse.error("NOT_FOUND", "Không tìm thấy dữ liệu");
            throw ex;
        }
    }
}
