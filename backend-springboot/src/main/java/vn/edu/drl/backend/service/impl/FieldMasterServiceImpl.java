package vn.edu.drl.backend.service.impl;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.drl.backend.dao.CriteriaRepository;
import vn.edu.drl.backend.dao.FieldMasterHistoryRepository;
import vn.edu.drl.backend.dao.FieldMasterRepository;
import vn.edu.drl.backend.dto.request.FieldMasterRequest;
import vn.edu.drl.backend.dto.response.FieldMasterHistoryResponse;
import vn.edu.drl.backend.dto.response.FieldMasterResponse;
import vn.edu.drl.backend.model.FieldMaster;
import vn.edu.drl.backend.model.FieldMasterHistory;
import vn.edu.drl.backend.service.FieldMasterService;

import java.time.Instant;
import java.util.List;
import java.util.regex.Pattern;
import java.util.regex.PatternSyntaxException;
import java.util.stream.Collectors;

@Service
public class FieldMasterServiceImpl implements FieldMasterService {
    private final FieldMasterRepository fieldMasterRepository;
    private final CriteriaRepository criteriaRepository;
    private final FieldMasterHistoryRepository fieldMasterHistoryRepository;

    public FieldMasterServiceImpl(FieldMasterRepository fieldMasterRepository,
                                  CriteriaRepository criteriaRepository,
                                  FieldMasterHistoryRepository fieldMasterHistoryRepository) {
        this.fieldMasterRepository = fieldMasterRepository;
        this.criteriaRepository = criteriaRepository;
        this.fieldMasterHistoryRepository = fieldMasterHistoryRepository;
    }

    @Override
    public Page<FieldMasterResponse> getAllFields(Pageable pageable) {
        return fieldMasterRepository.findAll(pageable).map(FieldMasterResponse::new);
    }

    @Override
    public FieldMasterResponse getFieldById(Long id) {
        FieldMaster field = fieldMasterRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("NOT_FOUND"));
        
        List<FieldMasterHistoryResponse> histories = getFieldHistories(id);
        if (histories.isEmpty()) {
            saveHistory(field);
            histories = getFieldHistories(id);
        }
        
        FieldMasterResponse response = new FieldMasterResponse(field);
        response.setVersions(histories);
        return response;
    }

    @Override
    public List<FieldMasterHistoryResponse> getFieldHistories(Long id) {
        return fieldMasterHistoryRepository.findByFieldIdOrderByIdDesc(id)
                .stream()
                .map(FieldMasterHistoryResponse::new)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public FieldMasterResponse createField(FieldMasterRequest request) {
        validateRequest(request, null);
        FieldMaster field = new FieldMaster();
        mapToEntity(request, field);
        field.setVersion("1.0");
        Instant now = Instant.now();
        field.setUpdatedAt(now);
        field = fieldMasterRepository.save(field);

        // Save snapshot for version 1.0
        saveHistory(field);

        FieldMasterResponse response = new FieldMasterResponse(field);
        response.setVersions(getFieldHistories(field.getId()));
        return response;
    }

    @Override
    @Transactional
    public FieldMasterResponse updateField(Long id, FieldMasterRequest request) {
        FieldMaster field = fieldMasterRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("NOT_FOUND"));
        
        validateRequest(request, id);
        
        if (!field.getFieldCode().equals(request.getFieldCode())) {
            if (criteriaRepository.existsByFieldMasterId(id)) {
                throw new RuntimeException("FORM_LOCKED_FIELD_CODE");
            }
        }

        // Safety: If no prior history existed, archive current state before updating
        if (fieldMasterHistoryRepository.findByFieldIdOrderByIdDesc(id).isEmpty()) {
            saveHistory(field);
        }
        
        mapToEntity(request, field);
        String nextVer = incrementVersion(field.getVersion());
        field.setVersion(nextVer);
        field.setUpdatedAt(Instant.now());
        field = fieldMasterRepository.save(field);

        // Save history snapshot for the new version
        saveHistory(field);

        FieldMasterResponse response = new FieldMasterResponse(field);
        response.setVersions(getFieldHistories(id));
        return response;
    }

    @Override
    @Transactional
    public FieldMasterResponse toggleStatus(Long id) {
        FieldMaster field = fieldMasterRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("NOT_FOUND"));
        field.setIsActive(!field.getIsActive());
        field.setUpdatedAt(Instant.now());
        field = fieldMasterRepository.save(field);
        return new FieldMasterResponse(field);
    }

    public static String incrementVersion(String currentVersion) {
        if (currentVersion == null || currentVersion.trim().isEmpty()) {
            return "1.1";
        }
        String v = currentVersion.trim();
        if (v.startsWith("v") || v.startsWith("V")) {
            v = v.substring(1);
        }
        String[] parts = v.split("\\.");
        if (parts.length >= 2) {
            try {
                int major = Integer.parseInt(parts[0]);
                int minor = Integer.parseInt(parts[1]);
                return major + "." + (minor + 1);
            } catch (NumberFormatException ignored) {
            }
        } else if (parts.length == 1) {
            try {
                int major = Integer.parseInt(parts[0]);
                return major + ".1";
            } catch (NumberFormatException ignored) {
            }
        }
        return "1.1";
    }

    private void saveHistory(FieldMaster field) {
        FieldMasterHistory history = new FieldMasterHistory();
        history.setFieldId(field.getId());
        history.setVersion(field.getVersion() != null ? field.getVersion() : "1.0");
        history.setFieldCode(field.getFieldCode());
        history.setFieldName(field.getFieldName());
        history.setDataType(field.getDataType());
        history.setCategory(field.getCategory());
        history.setIsRequired(field.getIsRequired());
        history.setMinValue(field.getMinValue());
        history.setMaxValue(field.getMaxValue());
        history.setRegexPattern(field.getRegexPattern());
        history.setDescription(field.getDescription());
        history.setIsActive(field.getIsActive());
        history.setCreatedAt(field.getUpdatedAt() != null ? field.getUpdatedAt() : Instant.now());
        fieldMasterHistoryRepository.save(history);
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
