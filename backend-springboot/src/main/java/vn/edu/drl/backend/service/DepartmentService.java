package vn.edu.drl.backend.service;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import vn.edu.drl.backend.dao.DepartmentRepository;
import vn.edu.drl.backend.model.Department;
import vn.edu.drl.backend.dto.request.DepartmentRequest;
import java.util.List;
import java.util.Map;

public interface DepartmentService {
    List<vn.edu.drl.backend.dto.response.DepartmentResponse> findAll();
    Department create(DepartmentRequest req);
    Map<String, Object> importFromExcel(MultipartFile file, boolean preview);
    Department toggleStatus(Long id);
}