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
    public ApiResponse<FormVersionResponse> activateTemplate(@PathVariable Long id) {
        return ApiResponse.success(formVersionService.activateTemplate(id));
    }
}
