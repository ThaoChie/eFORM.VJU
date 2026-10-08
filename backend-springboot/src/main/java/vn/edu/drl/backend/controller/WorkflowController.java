package vn.edu.drl.backend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import vn.edu.drl.backend.Wrapper.ApiResponse;
import vn.edu.drl.backend.Wrapper.PageWrapper;
import vn.edu.drl.backend.dto.request.ClassApproveRequest;
import vn.edu.drl.backend.dto.request.DeanApproveBatchRequest;
import vn.edu.drl.backend.dto.request.RejectRequest;
import vn.edu.drl.backend.dto.response.DeanApproveBatchResponse;
import vn.edu.drl.backend.dto.response.WorkflowDetailResponse;
import vn.edu.drl.backend.dto.response.WorkflowQueueItemResponse;
import vn.edu.drl.backend.security.SecurityUtils;
import vn.edu.drl.backend.service.WorkflowService;
import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/v1/workflow")
@RequiredArgsConstructor
public class WorkflowController {

    private final WorkflowService workflowService;

    @GetMapping("/pending-queue")
    @PreAuthorize("hasAnyRole('CLASS_LEADER', 'DEAN')")
    public ApiResponse<PageWrapper<WorkflowQueueItemResponse>> getPendingQueue(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Long userId = SecurityUtils.getCurrentUserId();
        Pageable pageable = PageRequest.of(page, size);
        Page<WorkflowQueueItemResponse> result = workflowService.getPendingQueue(userId, pageable);
        return ApiResponse.success(new PageWrapper<>(result));
    }

    @GetMapping("/forms/{id}")
    @PreAuthorize("hasAnyRole('CLASS_LEADER', 'DEAN', 'ADMIN')")
    public ApiResponse<WorkflowDetailResponse> getFormDetail(@PathVariable Long id) {
        Long userId = SecurityUtils.getCurrentUserId();
        return ApiResponse.success(workflowService.getFormDetail(userId, id));
    }

    @PostMapping("/{id}/class/approve")
    @PreAuthorize("hasRole('CLASS_LEADER')")
    public ApiResponse<Void> classApprove(@PathVariable Long id, @Valid @RequestBody ClassApproveRequest request, HttpServletRequest httpRequest) {
        Long userId = SecurityUtils.getCurrentUserId();
        String ipAddress = httpRequest.getRemoteAddr();
        workflowService.classApprove(userId, id, request, ipAddress);
        return ApiResponse.success(null);
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('CLASS_LEADER', 'DEAN')")
    public ApiResponse<Void> rejectForm(@PathVariable Long id, @Valid @RequestBody RejectRequest request) {
        Long userId = SecurityUtils.getCurrentUserId();
        workflowService.rejectForm(userId, id, request);
        return ApiResponse.success(null);
    }

    @PostMapping("/dean/approve-batch")
    @PreAuthorize("hasRole('DEAN')")
    public ApiResponse<DeanApproveBatchResponse> deanApproveBatch(@Valid @RequestBody DeanApproveBatchRequest request, HttpServletRequest httpRequest) {
        Long userId = SecurityUtils.getCurrentUserId();
        String ipAddress = httpRequest.getRemoteAddr();
        return ApiResponse.success(workflowService.deanApproveBatch(userId, request, ipAddress));
    }
}
