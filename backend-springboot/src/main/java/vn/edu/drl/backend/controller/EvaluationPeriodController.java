package vn.edu.drl.backend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import vn.edu.drl.backend.Wrapper.ApiResponse;
import vn.edu.drl.backend.dto.request.EvaluationPeriodRequest;
import vn.edu.drl.backend.dto.request.ExtendDeadlineRequest;
import vn.edu.drl.backend.dto.response.EvaluationPeriodFormOptionsResponse;
import vn.edu.drl.backend.dto.response.EvaluationPeriodResponse;
import vn.edu.drl.backend.enu.EvaluationPeriodStatus;
import vn.edu.drl.backend.security.SecurityUtils;
import vn.edu.drl.backend.service.EvaluationPeriodService;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class EvaluationPeriodController {

    private final EvaluationPeriodService evaluationPeriodService;

    // Admin endpoints (UC018)
    @GetMapping("/api/v1/admin/evaluation-periods")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<List<EvaluationPeriodResponse>> searchPeriods(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long semesterId,
            @RequestParam(required = false) EvaluationPeriodStatus status
    ) {
        return ApiResponse.success(evaluationPeriodService.searchPeriods(keyword, semesterId, status));
    }

    @GetMapping("/api/v1/admin/evaluation-periods/form-options")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<EvaluationPeriodFormOptionsResponse> getFormOptions() {
        return ApiResponse.success(evaluationPeriodService.getFormOptions());
    }

    @GetMapping("/api/v1/admin/evaluation-periods/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<EvaluationPeriodResponse> getPeriodById(@PathVariable Long id) {
        return ApiResponse.success(evaluationPeriodService.getPeriodById(id));
    }

    @PostMapping("/api/v1/admin/evaluation-periods")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<EvaluationPeriodResponse> createPeriod(@Valid @RequestBody EvaluationPeriodRequest request) {
        Long adminUserId = SecurityUtils.getCurrentUserId();
        return ApiResponse.success(evaluationPeriodService.createPeriod(adminUserId, request));
    }

    @PostMapping("/api/v1/admin/evaluation-periods/{id}/open")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<EvaluationPeriodResponse> openPeriod(@PathVariable Long id) {
        Long adminUserId = SecurityUtils.getCurrentUserId();
        return ApiResponse.success(evaluationPeriodService.openPeriod(adminUserId, id));
    }

    @PostMapping("/api/v1/admin/evaluation-periods/{id}/extend")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<EvaluationPeriodResponse> extendDeadline(
            @PathVariable Long id,
            @Valid @RequestBody ExtendDeadlineRequest request
    ) {
        Long adminUserId = SecurityUtils.getCurrentUserId();
        return ApiResponse.success(evaluationPeriodService.extendDeadline(adminUserId, id, request));
    }

    @PostMapping("/api/v1/admin/evaluation-periods/{id}/close")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<EvaluationPeriodResponse> closePeriod(@PathVariable Long id) {
        Long adminUserId = SecurityUtils.getCurrentUserId();
        return ApiResponse.success(evaluationPeriodService.closePeriod(adminUserId, id));
    }

    // Public / Authenticated student endpoint to get the currently active evaluation period
    @GetMapping("/api/v1/evaluation-periods/active")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<EvaluationPeriodResponse> getActivePeriod() {
        return ApiResponse.success(evaluationPeriodService.getActivePeriod());
    }
}
