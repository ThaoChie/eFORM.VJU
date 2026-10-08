package vn.edu.drl.backend.service.impl;

import vn.edu.drl.backend.service.*;

import vn.edu.drl.backend.service.FormVersionService;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.drl.backend.dao.CriteriaRepository;
import vn.edu.drl.backend.dao.FieldMasterRepository;
import vn.edu.drl.backend.dao.FormVersionRepository;
import vn.edu.drl.backend.dao.SemesterRepository;
import vn.edu.drl.backend.dto.request.FormTemplateRequest;
import vn.edu.drl.backend.dto.response.FormVersionResponse;
import vn.edu.drl.backend.enu.FormVersionStatus;
import vn.edu.drl.backend.model.Criteria;
import vn.edu.drl.backend.model.FieldMaster;
import vn.edu.drl.backend.model.FormVersion;
import vn.edu.drl.backend.model.Semester;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FormVersionServiceImpl implements FormVersionService {
    private final FormVersionRepository formVersionRepository;
    private final SemesterRepository semesterRepository;
    private final FieldMasterRepository fieldMasterRepository;
    private final CriteriaRepository criteriaRepository;
    private final ObjectMapper objectMapper;

    public List<FormVersionResponse> getTemplates() {
        return formVersionRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public FormVersionResponse getTemplateById(Long id) {
        FormVersion formVersion = formVersionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Template not found"));
        return mapToResponse(formVersion);
    }

    @Transactional
    public FormVersionResponse createTemplate(FormTemplateRequest request) {
        validateTemplateJson(request.getTemplateLayoutJson());

        Semester semester = semesterRepository.findById(request.getSemesterId())
                .orElseThrow(() -> new RuntimeException("Semester not found"));

        FormVersion formVersion = new FormVersion();
        formVersion.setFormCode(request.getFormCode());
        formVersion.setFormName(request.getFormName());
        formVersion.setSemester(semester);
        formVersion.setTemplateLayoutJson(request.getTemplateLayoutJson());
        formVersion.setStatus(FormVersionStatus.DRAFT);
        formVersion.setVersionNo("v1.0");

        FormVersion saved = formVersionRepository.save(formVersion);
        return mapToResponse(saved);
    }

    @Transactional
    public FormVersionResponse updateTemplate(Long id, FormTemplateRequest request) {
        validateTemplateJson(request.getTemplateLayoutJson());

        FormVersion formVersion = formVersionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Template not found"));

        Semester semester = semesterRepository.findById(request.getSemesterId())
                .orElseThrow(() -> new RuntimeException("Semester not found"));

        if (formVersion.getStatus() == FormVersionStatus.DRAFT) {
            formVersion.setFormCode(request.getFormCode());
            formVersion.setFormName(request.getFormName());
            formVersion.setSemester(semester);
            formVersion.setTemplateLayoutJson(request.getTemplateLayoutJson());
            return mapToResponse(formVersionRepository.save(formVersion));
        } else if (formVersion.getStatus() == FormVersionStatus.ACTIVE) {
            // Clone to new DRAFT
            FormVersion cloned = new FormVersion();
            cloned.setFormCode(request.getFormCode());
            cloned.setFormName(request.getFormName());
            cloned.setSemester(semester);
            cloned.setTemplateLayoutJson(request.getTemplateLayoutJson());
            cloned.setStatus(FormVersionStatus.DRAFT);
            
            // Increment version
            String currentVersion = formVersion.getVersionNo();
            String newVersion = incrementVersion(currentVersion);
            cloned.setVersionNo(newVersion);
            
            return mapToResponse(formVersionRepository.save(cloned));
        } else {
            throw new RuntimeException("Cannot update INACTIVE template");
        }
    }

    @Transactional
    public FormVersionResponse activateTemplate(Long id) {
        FormVersion formVersion = formVersionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Template not found"));

        if (formVersion.getStatus() == FormVersionStatus.ACTIVE) {
            return mapToResponse(formVersion);
        }

        // Validate total max_score = 100 for the semester criteria
        List<Criteria> criteriaList = criteriaRepository.findBySemesterId(formVersion.getSemester().getId());
        BigDecimal totalScore = criteriaList.stream()
                .map(Criteria::getMaxScore)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        if (totalScore.compareTo(new BigDecimal("100")) != 0) {
            throw new RuntimeException("Total criteria score must be 100 to activate form. Current: " + totalScore);
        }

        // Deactivate current active form for same code and semester
        Optional<FormVersion> currentActive = formVersionRepository.findByFormCodeAndSemesterIdAndStatus(
                formVersion.getFormCode(), formVersion.getSemester().getId(), FormVersionStatus.ACTIVE);
        
        currentActive.ifPresent(active -> {
            active.setStatus(FormVersionStatus.INACTIVE);
            formVersionRepository.save(active);
        });

        formVersion.setStatus(FormVersionStatus.ACTIVE);
        return mapToResponse(formVersionRepository.save(formVersion));
    }

    private void validateTemplateJson(String json) {
        try {
            JsonNode root = objectMapper.readTree(json);
            List<String> fieldCodes = extractFieldCodes(json);
            for (String code : fieldCodes) {
                FieldMaster field = fieldMasterRepository.findByFieldCode(code)
                        .orElseThrow(() -> new RuntimeException("Field code not found: " + code));
                if (!Boolean.TRUE.equals(field.getIsActive())) {
                    throw new RuntimeException("Field code is inactive: " + code);
                }
            }
        } catch (Exception e) {
            throw new RuntimeException("Invalid JSON format or field codes: " + e.getMessage());
        }
    }

    private List<String> extractFieldCodes(String json) {
        List<String> codes = new ArrayList<>();
        Pattern pattern = Pattern.compile("\"fieldCode\"\\s*:\\s*\"([^\"]+)\"");
        Matcher matcher = pattern.matcher(json);
        while (matcher.find()) {
            codes.add(matcher.group(1));
        }
        return codes;
    }

    private String incrementVersion(String version) {
        if (version == null || !version.startsWith("v")) {
            return "v1.0";
        }
        try {
            String numPart = version.substring(1);
            String[] parts = numPart.split("\\.");
            int major = Integer.parseInt(parts[0]);
            int minor = parts.length > 1 ? Integer.parseInt(parts[1]) : 0;
            minor++;
            return "v" + major + "." + minor;
        } catch (Exception e) {
            return version + ".1";
        }
    }

    private FormVersionResponse mapToResponse(FormVersion formVersion) {
        FormVersionResponse response = new FormVersionResponse();
        response.setId(formVersion.getId());
        response.setFormCode(formVersion.getFormCode());
        response.setFormName(formVersion.getFormName());
        response.setVersionNo(formVersion.getVersionNo());
        response.setSemesterId(formVersion.getSemester().getId());
        response.setTemplateLayoutJson(formVersion.getTemplateLayoutJson());
        response.setStatus(formVersion.getStatus());
        response.setCreatedAt(formVersion.getCreatedAt());
        return response;
    }
}
