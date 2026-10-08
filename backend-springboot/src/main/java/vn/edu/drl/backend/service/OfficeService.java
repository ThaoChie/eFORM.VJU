package vn.edu.drl.backend.service;

import vn.edu.drl.backend.dto.request.OfficeRequest;
import vn.edu.drl.backend.dto.response.OfficeResponse;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;
import java.util.Map;

public interface OfficeService {
    List<OfficeResponse> findAll();
    OfficeResponse create(OfficeRequest req);
    OfficeResponse update(Long id, OfficeRequest req);
    Object toggleStatus(Long id);
    byte[] generateExcelTemplate();
    byte[] exportToExcel();
    Map<String, Object> importFromExcel(MultipartFile file, boolean preview);
}
