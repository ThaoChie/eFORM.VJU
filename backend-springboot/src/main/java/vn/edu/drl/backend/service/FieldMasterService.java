package vn.edu.drl.backend.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import vn.edu.drl.backend.dao.CriteriaRepository;
import vn.edu.drl.backend.dao.FieldMasterRepository;
import vn.edu.drl.backend.dto.request.FieldMasterRequest;
import vn.edu.drl.backend.dto.response.FieldMasterResponse;
import vn.edu.drl.backend.model.FieldMaster;
import java.util.regex.Pattern;
import java.util.regex.PatternSyntaxException;


public interface FieldMasterService {

    Page<FieldMasterResponse> getAllFields(Pageable pageable);
    FieldMasterResponse createField(FieldMasterRequest request);
    FieldMasterResponse updateField(Long id, FieldMasterRequest request);
    FieldMasterResponse toggleStatus(Long id);
}
