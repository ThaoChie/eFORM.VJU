package vn.edu.drl.backend.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import vn.edu.drl.backend.Wrapper.ApiResponse;
import vn.edu.drl.backend.dto.request.SaveDraftRequest;
import vn.edu.drl.backend.dto.request.SubmitFormRequest;
import vn.edu.drl.backend.dto.response.EditorFormResponse;
import vn.edu.drl.backend.security.SecurityUtils;
import vn.edu.drl.backend.service.EditorService;

@RestController
@RequestMapping("/api/v1/editor")
@RequiredArgsConstructor
public class EditorController {
    private final EditorService editorService;

    @GetMapping("/my-form")
    @PreAuthorize("hasRole('STUDENT')")
    public ApiResponse<EditorFormResponse> getMyForm(@RequestParam Long semesterId) {
        Long userId = SecurityUtils.getCurrentUserId();
        return ApiResponse.success(editorService.getMyForm(userId, semesterId));
    }

    @PostMapping("/save-draft")
    @PreAuthorize("hasRole('STUDENT')")
    public ApiResponse<Void> saveDraft(@RequestBody SaveDraftRequest request) {
        Long userId = SecurityUtils.getCurrentUserId();
        editorService.saveDraft(userId, request);
        return ApiResponse.success(null);
    }

    @PostMapping("/upload-proof")
    @PreAuthorize("hasRole('STUDENT')")
    public ApiResponse<String> uploadProof(@RequestParam Long semesterId, @RequestParam("file") MultipartFile file) throws Exception {
        Long userId = SecurityUtils.getCurrentUserId();
        String objectKey = editorService.uploadProof(userId, semesterId, file);
        return ApiResponse.success(objectKey);
    }

    @PostMapping("/submit-and-sign")
    @PreAuthorize("hasRole('STUDENT')")
    public ApiResponse<Void> submitAndSign(@Valid @RequestBody SubmitFormRequest request, HttpServletRequest httpRequest) {
        Long userId = SecurityUtils.getCurrentUserId();
        String ipAddress = httpRequest.getRemoteAddr();
        editorService.submitAndSign(userId, request, ipAddress);
        return ApiResponse.success(null);
    }

    @DeleteMapping("/cancel-draft")
    @PreAuthorize("hasRole('STUDENT')")
    public ApiResponse<Void> cancelDraft(@RequestParam Long semesterId) {
        Long userId = SecurityUtils.getCurrentUserId();
        editorService.cancelDraft(userId, semesterId);
        return ApiResponse.success(null);
    }
}
