package vn.edu.drl.backend.service;
import vn.edu.drl.backend.dto.request.ClassRequest;
import vn.edu.drl.backend.dto.response.ClassResponse;
import vn.edu.drl.backend.model.ClassEntity;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;
import java.util.Map;

public interface ClassService {
    List<ClassResponse> findAll();
    ClassResponse create(ClassRequest req);
    ClassResponse update(Long id, ClassRequest req);
    ClassResponse toggleStatus(Long id);
    Map<String, Object> importFromExcel(MultipartFile file, boolean dryRun);
    byte[] generateExcelTemplate();
}
