package vn.edu.drl.backend.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import vn.edu.drl.backend.Wrapper.ApiResponse;
import vn.edu.drl.backend.dto.request.SaveDraftRequest;
import vn.edu.drl.backend.dto.request.SubmitFormRequest;
import vn.edu.drl.backend.dto.response.EditorFormResponse;
import vn.edu.drl.backend.security.SecurityUtils;
import vn.edu.drl.backend.service.EditorService;
import vn.edu.drl.backend.service.StorageService;

@RestController
@RequestMapping("/api/v1/editor")
@RequiredArgsConstructor
public class EditorController {
    private final EditorService editorService;
    private final StorageService storageService;

    @GetMapping("/my-form")
    @PreAuthorize("hasAnyRole('STUDENT', 'CLASS_LEADER', 'CLASS_DEPUTY')")
    public ApiResponse<EditorFormResponse> getMyForm(@RequestParam Long semesterId) {
        Long userId = SecurityUtils.getCurrentUserId();
        return ApiResponse.success(editorService.getMyForm(userId, semesterId));
    }

    @GetMapping("/form/{id}")
    @PreAuthorize("hasAnyRole('STUDENT', 'CLASS_LEADER', 'CLASS_DEPUTY')")
    public ApiResponse<EditorFormResponse> getMyFormById(@PathVariable Long id) {
        Long userId = SecurityUtils.getCurrentUserId();
        return ApiResponse.success(editorService.getMyFormById(userId, id));
    }

    @GetMapping("/history")
    @PreAuthorize("hasAnyRole('STUDENT', 'CLASS_LEADER', 'CLASS_DEPUTY')")
    public ApiResponse<java.util.List<vn.edu.drl.backend.dto.response.StudentHistoryResponse>> getMyHistory() {
        Long userId = SecurityUtils.getCurrentUserId();
        return ApiResponse.success(editorService.getMyHistory(userId));
    }

    @PostMapping("/save-draft")
    @PreAuthorize("hasAnyRole('STUDENT', 'CLASS_LEADER', 'CLASS_DEPUTY')")
    public ApiResponse<Void> saveDraft(@RequestBody SaveDraftRequest request) {
        Long userId = SecurityUtils.getCurrentUserId();
        editorService.saveDraft(userId, request);
        return ApiResponse.success(null);
    }

    @PostMapping("/upload-proof")
    @PreAuthorize("hasAnyRole('STUDENT', 'CLASS_LEADER', 'CLASS_DEPUTY')")
    public ApiResponse<String> uploadProof(@RequestParam Long semesterId, @RequestParam("file") MultipartFile file) throws Exception {
        Long userId = SecurityUtils.getCurrentUserId();
        String objectKey = editorService.uploadProof(userId, semesterId, file);
        return ApiResponse.success("/api/v1/editor/proofs/" + objectKey);
    }

    @GetMapping("/proofs/{filename}")
    public ResponseEntity<byte[]> getProofFile(@PathVariable String filename) {
        try {
            byte[] bytes = storageService.getFileBytes("proofs", filename);
            String contentType = "application/octet-stream";
            String lower = filename.toLowerCase();
            if (lower.endsWith(".pdf")) {
                contentType = "application/pdf";
            } else if (lower.endsWith(".png")) {
                contentType = "image/png";
            } else if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) {
                contentType = "image/jpeg";
            }
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                    .contentType(MediaType.parseMediaType(contentType))
                    .body(bytes);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/submit-and-sign")
    @PreAuthorize("hasAnyRole('STUDENT', 'CLASS_LEADER', 'CLASS_DEPUTY')")
    public ApiResponse<Void> submitAndSign(@Valid @RequestBody SubmitFormRequest request, HttpServletRequest httpRequest) {
        Long userId = SecurityUtils.getCurrentUserId();
        String ipAddress = httpRequest.getRemoteAddr();
        editorService.submitAndSign(userId, request, ipAddress);
        return ApiResponse.success(null);
    }

    @DeleteMapping("/cancel-draft")
    @PreAuthorize("hasAnyRole('STUDENT', 'CLASS_LEADER', 'CLASS_DEPUTY')")
    public ApiResponse<Void> cancelDraft(@RequestParam Long semesterId) {
        Long userId = SecurityUtils.getCurrentUserId();
        editorService.cancelDraft(userId, semesterId);
        return ApiResponse.success(null);
    }
}
