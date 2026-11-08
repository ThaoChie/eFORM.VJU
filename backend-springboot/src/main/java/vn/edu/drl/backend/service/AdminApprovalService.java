package vn.edu.drl.backend.service;

import vn.edu.drl.backend.dto.response.AdminApprovalItemResponse;
import java.util.List;

public interface AdminApprovalService {
    List<AdminApprovalItemResponse> getPendingQueue(String tab);
    void approve(String type, Long id, String reason);
    void reject(String type, Long id, String reason);
}
