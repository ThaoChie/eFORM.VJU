package vn.edu.drl.backend.service.impl;

import vn.edu.drl.backend.service.*;

import vn.edu.drl.backend.service.EditorService;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import vn.edu.drl.backend.dao.*;
import vn.edu.drl.backend.dto.request.SaveDraftRequest;
import vn.edu.drl.backend.dto.request.SubmitFormRequest;
import vn.edu.drl.backend.dto.response.EditorFormResponse;
import vn.edu.drl.backend.enu.FormVersionStatus;
import vn.edu.drl.backend.enu.NotificationType;
import vn.edu.drl.backend.enu.Role;
import vn.edu.drl.backend.enu.ScoreFormStatus;
import vn.edu.drl.backend.model.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EditorServiceImpl implements EditorService {
    private final ScoreFormRepository scoreFormRepository;
    private final ScoreFormDetailRepository scoreFormDetailRepository;
    private final SemesterRepository semesterRepository;
    private final FormVersionRepository formVersionRepository;
    private final CriteriaRepository criteriaRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;
    private final StorageService storageService;
    private final SignatureLogRepository signatureLogRepository;
    private final NotificationService notificationService;

    @Transactional
    public EditorFormResponse getMyForm(Long userId, Long semesterId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Semester semester = semesterRepository.findById(semesterId)
                .orElseThrow(() -> new RuntimeException("Semester not found"));

        Optional<ScoreForm> existingForm = scoreFormRepository.findByStudentIdAndSemesterId(userId, semesterId);

        if (existingForm.isPresent()) {
            return mapToEditorResponse(existingForm.get());
        }

        if (!Boolean.TRUE.equals(semester.getIsActive())) {
            throw new RuntimeException("Semester is not active");
        }

        FormVersion activeForm = formVersionRepository.findByFormCodeAndSemesterIdAndStatus("FORM_DRL", semesterId, FormVersionStatus.ACTIVE)
                .orElseGet(() -> formVersionRepository.findAll().stream()
                        .filter(f -> f.getSemester().getId().equals(semesterId) && f.getStatus() == FormVersionStatus.ACTIVE)
                        .findFirst()
                        .orElseThrow(() -> new RuntimeException("No ACTIVE form template found for this semester")));

        ScoreForm scoreForm = new ScoreForm();
        scoreForm.setStudent(user);
        scoreForm.setSemester(semester);
        scoreForm.setFormVersion(activeForm);
        scoreForm.setStatus(ScoreFormStatus.DRAFT);
        scoreForm.setStudentTotal(BigDecimal.ZERO);
        ScoreForm savedForm = scoreFormRepository.save(scoreForm);

        List<Criteria> criteriaList = criteriaRepository.findBySemesterId(semesterId);
        for (Criteria c : criteriaList) {
            ScoreFormDetail detail = new ScoreFormDetail();
            detail.setScoreForm(savedForm);
            detail.setCriteria(c);
            detail.setStudentScore(BigDecimal.ZERO);
            scoreFormDetailRepository.save(detail);
        }

        return mapToEditorResponse(savedForm);
    }

    @Transactional
    public void saveDraft(Long userId, SaveDraftRequest request) {
        ScoreForm form = getFormForEdit(userId, request.getSemesterId());

        List<ScoreFormDetail> details = scoreFormDetailRepository.findByScoreFormId(form.getId());
        Map<Long, ScoreFormDetail> detailMap = details.stream()
                .collect(Collectors.toMap(d -> d.getCriteria().getId(), Function.identity()));

        if (request.getDetails() != null) {
            for (SaveDraftRequest.DraftDetail reqDetail : request.getDetails()) {
                ScoreFormDetail dbDetail = detailMap.get(reqDetail.getCriteriaId());
                if (dbDetail != null) {
                    if (reqDetail.getStudentScore() != null) {
                        if (reqDetail.getStudentScore().compareTo(BigDecimal.ZERO) < 0 ||
                            reqDetail.getStudentScore().compareTo(dbDetail.getCriteria().getMaxScore()) > 0) {
                            throw new RuntimeException("Score out of bounds for criteria " + reqDetail.getCriteriaId());
                        }
                        dbDetail.setStudentScore(reqDetail.getStudentScore());
                    }
                    if (reqDetail.getProofUrl() != null) {
                        dbDetail.setProofUrl(reqDetail.getProofUrl());
                    }
                    scoreFormDetailRepository.save(dbDetail);
                }
            }
        }

        BigDecimal total = details.stream()
            .map(d -> d.getStudentScore() != null ? d.getStudentScore() : BigDecimal.ZERO)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
            
        form.setStudentTotal(total);
        scoreFormRepository.save(form);
    }

    @Transactional
    public String uploadProof(Long userId, Long semesterId, MultipartFile file) throws Exception {
        getFormForEdit(userId, semesterId);
        String contentType = file.getContentType();
        if (contentType == null || (!contentType.startsWith("image/") && !contentType.equals("application/pdf"))) {
            throw new RuntimeException("Invalid file type");
        }
        return storageService.uploadFile(file, "proofs");
    }

    @Transactional
    public void submitAndSign(Long userId, SubmitFormRequest request, String ipAddress) {
        ScoreForm form = getFormForEdit(userId, request.getSemesterId());

        List<ScoreFormDetail> details = scoreFormDetailRepository.findByScoreFormId(form.getId());
        BigDecimal total = BigDecimal.ZERO;
        for (ScoreFormDetail d : details) {
            if (Boolean.TRUE.equals(d.getCriteria().getRequiresProof()) && 
               (d.getProofUrl() == null || d.getProofUrl().isEmpty())) {
                throw new RuntimeException("Missing proof for criteria " + d.getCriteria().getCriteriaCode());
            }
            BigDecimal score = d.getStudentScore() != null ? d.getStudentScore() : BigDecimal.ZERO;
            total = total.add(score);
        }

        if (total.compareTo(new BigDecimal("100")) > 0) {
            throw new RuntimeException("Total score exceeded 100");
        }

        form.setStudentTotal(total);
        
        SignatureLog sigLog = new SignatureLog();
        sigLog.setScoreForm(form);
        sigLog.setSigner(userRepository.getReferenceById(userId));
        sigLog.setSignatureImgUrl(request.getSignatureBase64());
        sigLog.setSignOrder(vn.edu.drl.backend.enu.SignOrder.STUDENT.getValue());
        sigLog.setIpAddress(ipAddress);
        sigLog.setIsRevoked(false);
        signatureLogRepository.save(sigLog);

        String oldStatus = form.getStatus().name();
        form.setStatus(ScoreFormStatus.SUBMITTED);
        scoreFormRepository.save(form);

        auditService.log(form.getId(), userId, "SUBMIT", oldStatus, "SUBMITTED", "Student submitted form");

        User student = userRepository.findById(userId).get();
        if (student.getClassEntity() != null) {
            List<User> leaders = userRepository.findByClassEntityIdAndRole(student.getClassEntity().getId(), Role.CLASS_LEADER);
            for (User leader : leaders) {
                notificationService.createNotification(
                    leader.getId(), 
                    "Phiếu mới được nộp", 
                    "Sinh viên " + student.getFullName() + " đã nộp phiếu ĐRL", 
                    NotificationType.SYSTEM, 
                    "/workflow/forms/" + form.getId()
                );
            }
        }
    }

    @Transactional
    public void cancelDraft(Long userId, Long semesterId) {
        ScoreForm form = scoreFormRepository.findByStudentIdAndSemesterId(userId, semesterId)
                .orElseThrow(() -> new RuntimeException("Form not found"));

        if (form.getStatus() != ScoreFormStatus.DRAFT) {
            throw new RuntimeException("Only DRAFT form can be canceled");
        }
        
        scoreFormDetailRepository.deleteByScoreFormId(form.getId());
        scoreFormRepository.delete(form);
    }

    private ScoreForm getFormForEdit(Long userId, Long semesterId) {
        ScoreForm form = scoreFormRepository.findByStudentIdAndSemesterId(userId, semesterId)
                .orElseThrow(() -> new RuntimeException("Form not found"));

        if (form.getStatus() != ScoreFormStatus.DRAFT && form.getStatus() != ScoreFormStatus.REJECTED) {
            throw new RuntimeException("Form cannot be edited in current status: " + form.getStatus());
        }
        return form;
    }

    private EditorFormResponse mapToEditorResponse(ScoreForm form) {
        EditorFormResponse response = new EditorFormResponse();
        response.setScoreFormId(form.getId());
        response.setStatus(form.getStatus());
        response.setStudentTotal(form.getStudentTotal());
        response.setTemplateLayoutJson(form.getFormVersion().getTemplateLayoutJson());

        List<ScoreFormDetail> details = scoreFormDetailRepository.findByScoreFormId(form.getId());
        List<EditorFormResponse.EditorFormDetailResponse> detailResponses = details.stream().map(d -> {
            EditorFormResponse.EditorFormDetailResponse dr = new EditorFormResponse.EditorFormDetailResponse();
            dr.setCriteriaId(d.getCriteria().getId());
            dr.setCriteriaCode(d.getCriteria().getCriteriaCode());
            dr.setTitle(d.getCriteria().getTitle());
            dr.setMaxScore(d.getCriteria().getMaxScore());
            dr.setRequiresProof(d.getCriteria().getRequiresProof());
            dr.setStudentScore(d.getStudentScore());
            dr.setProofUrl(d.getProofUrl());
            dr.setNote(d.getNote());
            return dr;
        }).collect(Collectors.toList());

        response.setDetails(detailResponses);
        return response;
    }
}
