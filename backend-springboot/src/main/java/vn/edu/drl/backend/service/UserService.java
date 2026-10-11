package vn.edu.drl.backend.service;

import org.springframework.web.multipart.MultipartFile;
import vn.edu.drl.backend.dto.request.UserRequest;
import vn.edu.drl.backend.dto.response.UserResponse;
import vn.edu.drl.backend.model.User;

import java.util.List;
import java.util.Map;

public interface UserService {
    List<User> findAll();
    List<UserResponse> findUsers(Long deptId, Long classId, String cohort, String role);
    UserResponse create(UserRequest req);
    UserResponse update(Long id, UserRequest req);
    UserResponse toggleStatus(Long id);
    byte[] generateExcelTemplate();
    Map<String, Object> importFromExcel(MultipartFile file, boolean preview);
    byte[] exportToExcel(Long deptId, Long classId, String cohort, String role);
}
