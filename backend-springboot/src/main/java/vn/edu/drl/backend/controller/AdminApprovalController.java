package vn.edu.drl.backend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import vn.edu.drl.backend.Wrapper.ApiResponse;
import vn.edu.drl.backend.dto.response.AdminApprovalItemResponse;
import vn.edu.drl.backend.service.AdminApprovalService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/pending-queue")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminApprovalController {

    private final AdminApprovalService adminApprovalService;

    @GetMapping
    public ApiResponse<List<AdminApprovalItemResponse>> getPendingQueue(
            @RequestParam(required = false, defaultValue = "PENDING") String tab) {
        return ApiResponse.success(adminApprovalService.getPendingQueue(tab));
    }

    @PostMapping("/{type}/{id}/approve")
    public ApiResponse<Void> approve(
            @PathVariable String type,
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body) {
        String reason = body != null ? body.get("reason") : null;
        adminApprovalService.approve(type, id, reason);
        return ApiResponse.success(null);
    }

    @PostMapping("/{type}/{id}/reject")
    public ApiResponse<Void> reject(
            @PathVariable String type,
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body) {
        String reason = body != null ? body.get("reason") : null;
        adminApprovalService.reject(type, id, reason);
        return ApiResponse.success(null);
    }
}
