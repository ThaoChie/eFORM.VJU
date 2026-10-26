package vn.edu.drl.backend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import vn.edu.drl.backend.Wrapper.ApiResponse;
import vn.edu.drl.backend.dto.request.FormTemplateRequest;
import vn.edu.drl.backend.dto.response.FormVersionResponse;
import vn.edu.drl.backend.service.FormVersionService;

import java.util.List;

@RestController
@RequestMapping("/api/v1/forms/templates")
@RequiredArgsConstructor
public class FormVersionController {
    private final FormVersionService formVersionService;

    @GetMapping
    public ApiResponse<List<FormVersionResponse>> getTemplates() {
        return ApiResponse.success(formVersionService.getTemplates());
    }

    @GetMapping("/{id}")
    public ApiResponse<FormVersionResponse> getTemplateById(@PathVariable Long id) {
        return ApiResponse.success(formVersionService.getTemplateById(id));
    }

    @GetMapping("/{id}/versions")
    public ApiResponse<List<FormVersionResponse>> getTemplateVersions(@PathVariable Long id) {
        return ApiResponse.success(formVersionService.getTemplateVersions(id));
    }

    @GetMapping("/{id}/check-deactivate")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<java.util.Map<String, Object>> checkDeactivate(@PathVariable Long id) {
        return ApiResponse.success(formVersionService.checkDeactivate(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<FormVersionResponse> createTemplate(@Valid @RequestBody FormTemplateRequest request) {
        return ApiResponse.success(formVersionService.createTemplate(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<FormVersionResponse> updateTemplate(@PathVariable Long id, @Valid @RequestBody FormTemplateRequest request) {
        return ApiResponse.success(formVersionService.updateTemplate(id, request));
    }

    @PatchMapping("/{id}/activate")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<FormVersionResponse> activateTemplate(@PathVariable Long id, @RequestBody(required = false) java.util.Map<String, String> body) {
        String reason = body != null ? body.get("reason") : null;
        return ApiResponse.success(formVersionService.activateTemplate(id, reason));
    }

    @PatchMapping("/{id}/deactivate")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<FormVersionResponse> deactivateTemplate(@PathVariable Long id, @RequestBody(required = false) java.util.Map<String, String> body) {
        String reason = body != null ? body.get("reason") : null;
        return ApiResponse.success(formVersionService.deactivateTemplate(id, reason));
    }
}
