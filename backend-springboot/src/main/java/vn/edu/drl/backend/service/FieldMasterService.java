package vn.edu.drl.backend.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import vn.edu.drl.backend.dto.request.FieldMasterRequest;
import vn.edu.drl.backend.dto.response.FieldMasterHistoryResponse;
import vn.edu.drl.backend.dto.response.FieldMasterResponse;

import java.util.List;

public interface FieldMasterService {
    Page<FieldMasterResponse> getAllFields(Pageable pageable);
    FieldMasterResponse getFieldById(Long id);
    List<FieldMasterHistoryResponse> getFieldHistories(Long id);
    FieldMasterResponse createField(FieldMasterRequest request);
    FieldMasterResponse updateField(Long id, FieldMasterRequest request);
    FieldMasterResponse toggleStatus(Long id);
    java.util.Map<String, Object> importFromExcel(org.springframework.web.multipart.MultipartFile file, boolean preview);
    byte[] generateExcelTemplate();
}
