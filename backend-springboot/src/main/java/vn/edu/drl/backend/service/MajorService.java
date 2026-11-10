package vn.edu.drl.backend.service;

import org.springframework.web.multipart.MultipartFile;
import vn.edu.drl.backend.dto.request.MajorRequest;
import vn.edu.drl.backend.dto.response.MajorResponse;

import java.util.List;
import java.util.Map;

public interface MajorService {
    List<MajorResponse> findAll();
    MajorResponse findById(Long id);
    MajorResponse create(MajorRequest req);
    MajorResponse update(Long id, MajorRequest req);
    MajorResponse toggleStatus(Long id);
    byte[] generateExcelTemplate();
    Map<String, Object> importFromExcel(MultipartFile file, boolean preview);
}
