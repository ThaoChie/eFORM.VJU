package vn.edu.drl.backend.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import vn.edu.drl.backend.dao.CriteriaRepository;
import vn.edu.drl.backend.dao.FieldMasterRepository;
import vn.edu.drl.backend.dto.request.FieldMasterRequest;
import vn.edu.drl.backend.dto.response.FieldMasterResponse;
import vn.edu.drl.backend.model.FieldMaster;
import java.util.regex.Pattern;
import java.util.regex.PatternSyntaxException;

@Service
public class FieldMasterService {
    private final FieldMasterRepository fieldMasterRepository;
    private final CriteriaRepository criteriaRepository;

    public FieldMasterService(FieldMasterRepository fieldMasterRepository, CriteriaRepository criteriaRepository) {
        this.fieldMasterRepository = fieldMasterRepository;
        this.criteriaRepository = criteriaRepository;
    }

    public Page<FieldMasterResponse> getAllFields(Pageable pageable) {
        return fieldMasterRepository.findAll(pageable).map(FieldMasterResponse::new);
    }

    public FieldMasterResponse createField(FieldMasterRequest request) {
        validateRequest(request, null);
        FieldMaster field = new FieldMaster();
        mapToEntity(request, field);
        field = fieldMasterRepository.save(field);
        return new FieldMasterResponse(field);
    }

    public FieldMasterResponse updateField(Long id, FieldMasterRequest request) {
        FieldMaster field = fieldMasterRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("NOT_FOUND"));
        
        validateRequest(request, id);
        
        if (!field.getFieldCode().equals(request.getFieldCode())) {
            if (criteriaRepository.existsByFieldMasterId(id)) {
                throw new RuntimeException("FORM_LOCKED_FIELD_CODE");
            }
        }
        
        mapToEntity(request, field);
        field = fieldMasterRepository.save(field);
        return new FieldMasterResponse(field);
    }

    public FieldMasterResponse toggleStatus(Long id) {
        FieldMaster field = fieldMasterRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("NOT_FOUND"));
        field.setIsActive(!field.getIsActive());
        field = fieldMasterRepository.save(field);
        return new FieldMasterResponse(field);
    }

    private void validateRequest(FieldMasterRequest request, Long excludeId) {
        if (request.getMinValue() != null && request.getMaxValue() != null) {
            if (request.getMinValue().compareTo(request.getMaxValue()) > 0) {
                throw new RuntimeException("VALIDATION_ERROR: min_value must be <= max_value");
            }
        }
        if (request.getRegexPattern() != null && !request.getRegexPattern().isEmpty()) {
            try {
                Pattern.compile(request.getRegexPattern());
            } catch (PatternSyntaxException e) {
                throw new RuntimeException("VALIDATION_ERROR: Invalid regex pattern");
            }
        }
        if (excludeId == null) {
            if (fieldMasterRepository.existsByFieldCode(request.getFieldCode())) {
                throw new RuntimeException("DUPLICATE: field_code exists");
            }
        }
    }

    private void mapToEntity(FieldMasterRequest request, FieldMaster field) {
        field.setFieldCode(request.getFieldCode());
        field.setFieldName(request.getFieldName());
        field.setDataType(request.getDataType());
        field.setCategory(request.getCategory());
        field.setIsRequired(request.getIsRequired() != null ? request.getIsRequired() : false);
        field.setMinValue(request.getMinValue());
        field.setMaxValue(request.getMaxValue());
        field.setRegexPattern(request.getRegexPattern());
        field.setDescription(request.getDescription());
    }
}
