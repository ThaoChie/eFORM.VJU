package vn.edu.drl.backend.controller;

import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import vn.edu.drl.backend.Wrapper.ApiResponse;
import vn.edu.drl.backend.Wrapper.PageWrapper;
import vn.edu.drl.backend.dto.request.FieldMasterRequest;
import vn.edu.drl.backend.dto.response.FieldMasterHistoryResponse;
import vn.edu.drl.backend.dto.response.FieldMasterResponse;
import vn.edu.drl.backend.service.FieldMasterService;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;

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
        Page<FieldMasterResponse> pageResult = fieldMasterService.getAllFields(
                PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "id"))
        );
        return ApiResponse.success(new PageWrapper<>(pageResult));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ApiResponse<FieldMasterResponse> getFieldById(@PathVariable Long id) {
        try {
            return ApiResponse.success(fieldMasterService.getFieldById(id));
        } catch (RuntimeException ex) {
            if ("NOT_FOUND".equals(ex.getMessage())) {
                return ApiResponse.error("NOT_FOUND", "Không tìm thấy dữ liệu");
            }
            throw ex;
        }
    }

    @GetMapping("/{id}/versions")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ApiResponse<List<FieldMasterHistoryResponse>> getFieldVersions(@PathVariable Long id) {
        return ApiResponse.success(fieldMasterService.getFieldHistories(id));
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

    @RequestMapping(value = "/{id}/toggle-status", method = {RequestMethod.PATCH, RequestMethod.PUT})
    @PreAuthorize("hasAuthority('ADMIN')")
    public ApiResponse<FieldMasterResponse> toggleStatus(@PathVariable Long id) {
        try {
            return ApiResponse.success(fieldMasterService.toggleStatus(id));
        } catch (RuntimeException ex) {
            if ("NOT_FOUND".equals(ex.getMessage())) return ApiResponse.error("NOT_FOUND", "Không tìm thấy dữ liệu");
            throw ex;
        }
    }

    @GetMapping("/template-excel")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<byte[]> downloadTemplate() {
        byte[] data = fieldMasterService.generateExcelTemplate();
        return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=fields_template.xlsx")
            .body(data);
    }

    @PostMapping("/import")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ApiResponse<?> importExcel(@RequestParam("file") MultipartFile file,
                                      @RequestParam(defaultValue = "true") boolean preview) {
        return ApiResponse.success(fieldMasterService.importFromExcel(file, preview));
    }
}
