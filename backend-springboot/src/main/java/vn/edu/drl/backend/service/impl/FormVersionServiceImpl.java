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
    private final vn.edu.drl.backend.dao.ScoreFormRepository scoreFormRepository;
    private final ObjectMapper objectMapper;

    public List<FormVersionResponse> getTemplates() {
        return formVersionRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<FormVersionResponse> getTemplateVersions(Long id) {
        FormVersion formVersion = formVersionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Template not found"));
        List<FormVersion> versions = formVersionRepository.findByFormCodeOrderByCreatedAtDesc(formVersion.getFormCode());
        if (versions.isEmpty()) {
            versions = List.of(formVersion);
        }
        return versions.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    public java.util.Map<String, Object> checkDeactivate(Long id) {
        FormVersion formVersion = formVersionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Template not found"));
        long pendingCount = scoreFormRepository.countUnfinishedByFormVersionId(id);
        java.util.Map<String, Object> map = new java.util.HashMap<>();
        map.put("formVersionId", id);
        map.put("pendingCount", pendingCount);
        map.put("canDeactivate", pendingCount == 0);
        return map;
    }

    public FormVersionResponse getTemplateById(Long id) {
        FormVersion formVersion = formVersionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Template not found"));
        return mapToResponse(formVersion);
    }

    @Transactional
    public FormVersionResponse createTemplate(FormTemplateRequest request) {
        validateTemplateJson(request.getTemplateLayoutJson());

        if (request.getSemesterId() == null) {
            throw new RuntimeException("Semester ID is required");
        }
        Semester semester = semesterRepository.findById(request.getSemesterId())
                .orElseThrow(() -> new RuntimeException("Semester not found"));

        FormVersion formVersion = new FormVersion();
        formVersion.setFormCode(request.getFormCode());
        formVersion.setFormName(request.getFormName());
        formVersion.setSemester(semester);
        formVersion.setTemplateLayoutJson(request.getTemplateLayoutJson());
        
        FormVersionStatus targetStatus = request.getStatus() != null ? request.getStatus() : FormVersionStatus.DRAFT;
        formVersion.setStatus(targetStatus);

        String versionNo = request.getVersionNo();
        if (versionNo == null || versionNo.trim().isEmpty()) {
            List<FormVersion> existing = formVersionRepository.findByFormCodeOrderByCreatedAtDesc(request.getFormCode());
            if (!existing.isEmpty() && existing.get(0).getVersionNo() != null) {
                versionNo = incrementVersion(existing.get(0).getVersionNo());
            } else {
                versionNo = "v1.0";
            }
        }
        formVersion.setVersionNo(versionNo);

        if (targetStatus == FormVersionStatus.ACTIVE) {
            Optional<FormVersion> currentActive = formVersionRepository.findByFormCodeAndSemesterIdAndStatus(
                    request.getFormCode(), semester.getId(), FormVersionStatus.ACTIVE);
            currentActive.ifPresent(active -> {
                active.setStatus(FormVersionStatus.INACTIVE);
                formVersionRepository.save(active);
            });
        }

        FormVersion saved = formVersionRepository.save(formVersion);
        return mapToResponse(saved);
    }

    @Transactional
    public FormVersionResponse updateTemplate(Long id, FormTemplateRequest request) {
        validateTemplateJson(request.getTemplateLayoutJson());

        FormVersion formVersion = formVersionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Template not found"));

        Semester semester = (request.getSemesterId() != null)
                ? semesterRepository.findById(request.getSemesterId()).orElse(formVersion.getSemester())
                : formVersion.getSemester();

        if (request.getFormCode() != null && !request.getFormCode().trim().isEmpty()) {
            formVersion.setFormCode(request.getFormCode());
        }
        if (request.getFormName() != null && !request.getFormName().trim().isEmpty()) {
            formVersion.setFormName(request.getFormName());
        }
        if (semester != null) {
            formVersion.setSemester(semester);
        }
        if (request.getTemplateLayoutJson() != null) {
            formVersion.setTemplateLayoutJson(request.getTemplateLayoutJson());
        }

        return mapToResponse(formVersionRepository.save(formVersion));
    }

    @Transactional
    public FormVersionResponse activateTemplate(Long id) {
        return activateTemplate(id, null);
    }

    @Transactional
    public FormVersionResponse activateTemplate(Long id, String reason) {
        FormVersion formVersion = formVersionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phiên bản biểu mẫu"));

        if (formVersion.getStatus() == FormVersionStatus.ACTIVE) {
            return mapToResponse(formVersion);
        }

        // Validate total max_score = 100 for the semester criteria
        List<Criteria> criteriaList = criteriaRepository.findBySemesterId(formVersion.getSemester().getId());
        BigDecimal totalScore = criteriaList.stream()
                .map(Criteria::getMaxScore)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        if (totalScore.compareTo(new BigDecimal("100")) != 0) {
            throw new RuntimeException("Tổng điểm tối đa của các tiêu chí trong học kỳ phải đạt đúng 100 điểm. Hiện tại: " + totalScore);
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

    @Transactional
    public FormVersionResponse deactivateTemplate(Long id, String reason) {
        FormVersion formVersion = formVersionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phiên bản biểu mẫu"));

        if (formVersion.getStatus() != FormVersionStatus.ACTIVE) {
            throw new RuntimeException("Chỉ có thể vô hiệu hóa phiên bản đang ở trạng thái Hiệu lực");
        }

        long pendingCount = scoreFormRepository.countUnfinishedByFormVersionId(id);
        if (pendingCount > 0) {
            throw new RuntimeException("409: Không thể vô hiệu hóa phiên bản đang có " + pendingCount + " phiếu ĐRL chưa hoàn tất.");
        }

        formVersion.setStatus(FormVersionStatus.INACTIVE);
        FormVersion saved = formVersionRepository.save(formVersion);
        return mapToResponse(saved);
    }

    private void validateTemplateJson(String json) {
        if (json == null || json.trim().isEmpty() || json.trim().equals("{}")) {
            return;
        }
        try {
            JsonNode root = objectMapper.readTree(json);
            List<String> fieldCodes = extractFieldCodes(json);
            for (String code : fieldCodes) {
                if (code.startsWith("sign_") || code.startsWith("group_") || code.startsWith("crit_") || code.startsWith("block_")) {
                    continue;
                }
                Optional<FieldMaster> fieldOpt = fieldMasterRepository.findByFieldCode(code);
                if (fieldOpt.isPresent() && !Boolean.TRUE.equals(fieldOpt.get().getIsActive())) {
                    throw new RuntimeException("Mã trường chưa được kích hoạt: " + code);
                }
            }
        } catch (Exception e) {
            throw new RuntimeException("Cấu hình JSON hoặc mã trường không hợp lệ: " + e.getMessage());
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
        if (formVersion.getSemester() != null) {
            response.setSemesterId(formVersion.getSemester().getId());
            response.setSemesterName(formVersion.getSemester().getSemesterName());
            response.setEffectiveFrom(formVersion.getSemester().getStartDate());
            response.setEffectiveTo(formVersion.getSemester().getEndDate());
        }
        response.setScope("Toàn hệ thống");
        response.setTemplateLayoutJson(formVersion.getTemplateLayoutJson());
        response.setStatus(formVersion.getStatus());
        response.setCreatedAt(formVersion.getCreatedAt());
        return response;
    }
}
