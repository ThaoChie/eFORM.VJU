package vn.edu.drl.backend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.edu.drl.backend.Wrapper.ApiResponse;
import vn.edu.drl.backend.dto.response.dashboard.AdminDashboardResponse;
import vn.edu.drl.backend.dto.response.dashboard.ClassLeaderDashboardResponse;
import vn.edu.drl.backend.dto.response.dashboard.DeanDashboardResponse;
import vn.edu.drl.backend.dto.response.dashboard.StudentDashboardResponse;
import vn.edu.drl.backend.security.SecurityUtils;
import vn.edu.drl.backend.service.DashboardService;

@RestController
@RequestMapping("/api/v1/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<AdminDashboardResponse> getAdminDashboard() {
        return ApiResponse.success(dashboardService.getAdminDashboard());
    }

    @GetMapping("/dean")
    @PreAuthorize("hasAnyRole('DEAN', 'ADMIN')")
    public ApiResponse<DeanDashboardResponse> getDeanDashboard() {
        Long userId = SecurityUtils.getCurrentUserId();
        return ApiResponse.success(dashboardService.getDeanDashboard(userId));
    }

    @GetMapping("/class-leader")
    @PreAuthorize("hasAnyRole('CLASS_LEADER', 'CLASS_DEPUTY', 'ADMIN')")
    public ApiResponse<ClassLeaderDashboardResponse> getClassLeaderDashboard() {
        Long userId = SecurityUtils.getCurrentUserId();
        return ApiResponse.success(dashboardService.getClassLeaderDashboard(userId));
    }

    @GetMapping("/student")
    @PreAuthorize("hasAnyRole('STUDENT', 'CLASS_LEADER', 'CLASS_DEPUTY', 'DEAN', 'ADMIN')")
    public ApiResponse<StudentDashboardResponse> getStudentDashboard() {
        Long userId = SecurityUtils.getCurrentUserId();
        return ApiResponse.success(dashboardService.getStudentDashboard(userId));
    }
}
