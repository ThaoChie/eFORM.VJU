package vn.edu.drl.backend.service.interfaces;

import vn.edu.drl.backend.dto.response.dashboard.AdminDashboardResponse;
import vn.edu.drl.backend.dto.response.dashboard.ClassLeaderDashboardResponse;
import vn.edu.drl.backend.dto.response.dashboard.DeanDashboardResponse;
import vn.edu.drl.backend.dto.response.dashboard.StudentDashboardResponse;

public interface DashboardService {
    AdminDashboardResponse getAdminDashboard();
    DeanDashboardResponse getDeanDashboard(Long userId);
    ClassLeaderDashboardResponse getClassLeaderDashboard(Long userId);
    StudentDashboardResponse getStudentDashboard(Long userId);
}
