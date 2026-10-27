package vn.edu.drl.backend.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.drl.backend.dao.FieldMasterRepository;
import vn.edu.drl.backend.dao.FormVersionRepository;
import vn.edu.drl.backend.dao.ScoreFormRepository;
import vn.edu.drl.backend.dao.UserRepository;
import vn.edu.drl.backend.dto.request.RejectRequest;
import vn.edu.drl.backend.dto.response.AdminApprovalItemResponse;
import vn.edu.drl.backend.enu.FormVersionStatus;
import vn.edu.drl.backend.enu.ScoreFormStatus;
import vn.edu.drl.backend.model.FieldMaster;
import vn.edu.drl.backend.model.FormVersion;
import vn.edu.drl.backend.model.ScoreForm;
import vn.edu.drl.backend.model.User;
import vn.edu.drl.backend.security.SecurityUtils;
import vn.edu.drl.backend.service.AdminApprovalService;
import vn.edu.drl.backend.service.FormVersionService;
import vn.edu.drl.backend.service.WorkflowService;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminApprovalServiceImpl implements AdminApprovalService {

    private final FormVersionRepository formVersionRepository;
    private final FieldMasterRepository fieldMasterRepository;
    private final ScoreFormRepository scoreFormRepository;
    private final FormVersionService formVersionService;
    private final WorkflowService workflowService;
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public List<AdminApprovalItemResponse> getPendingQueue(String tab) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        List<AdminApprovalItemResponse> items = new ArrayList<>();
        boolean isPendingOnly = !"ALL".equalsIgnoreCase(tab);

        // 1. Form Versions
        List<FormVersion> forms = isPendingOnly
                ? formVersionRepository.findByStatus(FormVersionStatus.DRAFT)
                : formVersionRepository.findAll();

        for (FormVersion f : forms) {
            boolean isOwn = f.getCreatedBy() != null && f.getCreatedBy().getId().equals(currentUserId);
            items.add(AdminApprovalItemResponse.builder()
                    .id(f.getId())
                    .type("FORM_VERSION")
                    .typeName("Phiên bản biểu mẫu")
                    .code(f.getFormCode() + "-" + f.getVersionNo())
                    .name(f.getFormName())
                    .requestType(f.getStatus() == FormVersionStatus.DRAFT ? "Yêu cầu kích hoạt" : "Hoạt động")
                    .owner(f.getCreatedBy() != null ? f.getCreatedBy().getFullName() : "Quản trị viên")
                    .ownerId(f.getCreatedBy() != null ? f.getCreatedBy().getId() : null)
                    .date(f.getCreatedAt() != null ? f.getCreatedAt() : Instant.now())
                    .own(isOwn)
                    .status(f.getStatus().name())
                    .description("Phiên bản biểu mẫu đánh giá ĐRL cho sinh viên")
                    .build());
        }

        // 2. Field Codes
        List<FieldMaster> fields = isPendingOnly
                ? fieldMasterRepository.findByIsActive(false)
                : fieldMasterRepository.findAll();

        for (FieldMaster fm : fields) {
            items.add(AdminApprovalItemResponse.builder()
                    .id(fm.getId())
                    .type("FIELD_CODE")
                    .typeName("Trường thông tin")
                    .code(fm.getFieldCode())
                    .name(fm.getFieldName())
                    .requestType(Boolean.TRUE.equals(fm.getIsActive()) ? "Hoạt động" : "Yêu cầu kích hoạt")
                    .owner("Quản trị viên")
                    .ownerId(null)
                    .date(fm.getCreatedAt() != null ? fm.getCreatedAt() : Instant.now())
                    .own(false)
                    .status(Boolean.TRUE.equals(fm.getIsActive()) ? "ACTIVE" : "INACTIVE")
                    .description(fm.getDescription() != null ? fm.getDescription() : "Trường dữ liệu tiêu chí đánh giá")
                    .build());
        }

        // 3. Score Forms
        List<ScoreForm> scoreForms = isPendingOnly
                ? scoreFormRepository.findByStatusIn(List.of(ScoreFormStatus.SUBMITTED, ScoreFormStatus.CLASS_APPROVED))
                : scoreFormRepository.findAll();

        for (ScoreForm sf : scoreForms) {
            String studentName = sf.getStudent() != null ? sf.getStudent().getFullName() : "Sinh viên";
            String studentCode = sf.getStudent() != null ? sf.getStudent().getUserCode() : "SV-" + sf.getId();
            String reqType = sf.getStatus() == ScoreFormStatus.CLASS_APPROVED
                    ? "Duyệt cấp Khoa/Trường"
                    : sf.getStatus() == ScoreFormStatus.SUBMITTED ? "Duyệt cấp Lớp" : sf.getStatus().name();

            items.add(AdminApprovalItemResponse.builder()
                    .id(sf.getId())
                    .type("SCORE_FORM")
                    .typeName("Phiếu điểm rèn luyện")
                    .code(studentCode)
                    .name(studentName + " (" + (sf.getStudent() != null && sf.getStudent().getClassEntity() != null ? sf.getStudent().getClassEntity().getClassName() : "") + ")")
                    .requestType(reqType)
                    .owner(studentName)
                    .ownerId(sf.getStudent() != null ? sf.getStudent().getId() : null)
                    .date(sf.getUpdatedAt() != null ? sf.getUpdatedAt() : sf.getCreatedAt())
                    .own(false)
                    .status(sf.getStatus().name())
                    .description("Điểm SV: " + (sf.getStudentTotal() != null ? sf.getStudentTotal() : "0") + " | Điểm Lớp: " + (sf.getClassTotal() != null ? sf.getClassTotal() : "Chưa chấm"))
                    .build());
        }

        // Sort newest first
        items.sort(Comparator.comparing(AdminApprovalItemResponse::getDate, Comparator.nullsLast(Comparator.reverseOrder())));
        return items;
    }

    @Override
    @Transactional
    public void approve(String type, Long id, String reason) {
        Long currentUserId = SecurityUtils.getCurrentUserId();

        if ("FORM_VERSION".equalsIgnoreCase(type)) {
            FormVersion form = formVersionRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy phiên bản biểu mẫu"));
            formVersionService.activateTemplate(id, reason);
        } else if ("FIELD_CODE".equalsIgnoreCase(type)) {
            FieldMaster field = fieldMasterRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy trường thông tin"));
            field.setIsActive(true);
            fieldMasterRepository.save(field);
        } else if ("SCORE_FORM".equalsIgnoreCase(type)) {
            ScoreForm form = scoreFormRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy phiếu điểm rèn luyện"));
            form.setStatus(ScoreFormStatus.DEAN_APPROVED);
            scoreFormRepository.save(form);
        } else {
            throw new RuntimeException("Loại đối tượng không hợp lệ: " + type);
        }
    }

    @Override
    @Transactional
    public void reject(String type, Long id, String reason) {
        Long currentUserId = SecurityUtils.getCurrentUserId();

        if ("FORM_VERSION".equalsIgnoreCase(type)) {
            FormVersion form = formVersionRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy phiên bản biểu mẫu"));
            formVersionService.deactivateTemplate(id, reason);
        } else if ("FIELD_CODE".equalsIgnoreCase(type)) {
            FieldMaster field = fieldMasterRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy trường thông tin"));
            field.setIsActive(false);
            fieldMasterRepository.save(field);
        } else if ("SCORE_FORM".equalsIgnoreCase(type)) {
            RejectRequest req = new RejectRequest();
            req.setReason(reason);
            workflowService.rejectForm(currentUserId, id, req);
        } else {
            throw new RuntimeException("Loại đối tượng không hợp lệ: " + type);
        }
    }
}
