package vn.edu.drl.backend.service.impl;

import vn.edu.drl.backend.service.*;

import vn.edu.drl.backend.service.WorkflowService;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.drl.backend.dao.*;
import vn.edu.drl.backend.dto.request.ClassApproveRequest;
import vn.edu.drl.backend.dto.request.DeanApproveBatchRequest;
import vn.edu.drl.backend.dto.request.RejectRequest;
import vn.edu.drl.backend.dto.response.DeanApproveBatchResponse;
import vn.edu.drl.backend.dto.response.WorkflowDetailResponse;
import vn.edu.drl.backend.dto.response.WorkflowQueueItemResponse;
import vn.edu.drl.backend.enu.NotificationType;
import vn.edu.drl.backend.enu.Role;
import vn.edu.drl.backend.enu.ScoreFormStatus;
import vn.edu.drl.backend.model.*;
import vn.edu.drl.backend.service.engine.*;

import java.math.BigDecimal;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WorkflowServiceImpl implements WorkflowService {
    private final ScoreFormRepository scoreFormRepository;
    private final ScoreFormDetailRepository scoreFormDetailRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;
    private final NotificationService notificationService;
    private final SignatureLogRepository signatureLogRepository;
    private final PythonRenderClient renderClient;
    private final PdfSignatureEngine signatureEngine;
    private final PdfLockEngine lockEngine;
    private final PdfHashEngine hashEngine;
    private final StorageService storageService;
    private final WorkflowBatchHelperService batchHelperService;

    @Transactional(readOnly = true)
    public Page<WorkflowQueueItemResponse> getPendingQueue(Long userId, Pageable pageable) {
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
        Page<ScoreForm> forms;

        if (user.getRole() == Role.CLASS_LEADER) {
            if (user.getClassEntity() == null) throw new RuntimeException("Class leader has no class");
            forms = scoreFormRepository.findByStatusAndStudentClassEntityId(ScoreFormStatus.SUBMITTED, user.getClassEntity().getId(), pageable);
        } else if (user.getRole() == Role.DEAN) {
            if (user.getDepartment() == null) throw new RuntimeException("Dean has no department");
            forms = scoreFormRepository.findByStatusAndStudentDepartmentId(ScoreFormStatus.CLASS_APPROVED, user.getDepartment().getId(), pageable);
        } else {
            throw new RuntimeException("Invalid role for pending queue");
        }

        return forms.map(f -> {
            WorkflowQueueItemResponse dto = new WorkflowQueueItemResponse();
            dto.setId(f.getId());
            dto.setStudentId(f.getStudent().getId());
            dto.setStudentCode(f.getStudent().getUserCode());
            dto.setStudentName(f.getStudent().getFullName());
            dto.setClassName(f.getStudent().getClassEntity() != null ? f.getStudent().getClassEntity().getClassName() : "");
            dto.setStatus(f.getStatus());
            dto.setStudentTotal(f.getStudentTotal());
            dto.setClassTotal(f.getClassTotal());
            dto.setSubmittedAt(f.getUpdatedAt() != null ? f.getUpdatedAt() : f.getCreatedAt());
            return dto;
        });
    }

    @Transactional(readOnly = true)
    public WorkflowDetailResponse getFormDetail(Long userId, Long formId) {
        User user = userRepository.findById(userId).orElseThrow();
        ScoreForm form = scoreFormRepository.findById(formId).orElseThrow(() -> new RuntimeException("Form not found"));

        if (user.getRole() == Role.CLASS_LEADER) {
            if (form.getStudent().getClassEntity() == null || !form.getStudent().getClassEntity().getId().equals(user.getClassEntity().getId())) {
                throw new RuntimeException("403 Forbidden");
            }
        } else if (user.getRole() == Role.DEAN) {
            if (form.getStudent().getDepartment() == null || !form.getStudent().getDepartment().getId().equals(user.getDepartment().getId())) {
                throw new RuntimeException("403 Forbidden");
            }
        }

        WorkflowDetailResponse res = new WorkflowDetailResponse();
        res.setScoreFormId(form.getId());
        res.setStudentName(form.getStudent().getFullName());
        res.setStudentCode(form.getStudent().getUserCode());
        res.setClassName(form.getStudent().getClassEntity() != null ? form.getStudent().getClassEntity().getClassName() : "");
        res.setStatus(form.getStatus());
        res.setStudentTotal(form.getStudentTotal());
        res.setClassTotal(form.getClassTotal());
        res.setFinalTotal(form.getFinalTotal());
        res.setTemplateLayoutJson(form.getFormVersion().getTemplateLayoutJson());

        List<ScoreFormDetail> details = scoreFormDetailRepository.findByScoreFormId(form.getId());
        res.setDetails(details.stream().map(d -> {
            WorkflowDetailResponse.WorkflowDetailItem item = new WorkflowDetailResponse.WorkflowDetailItem();
            item.setCriteriaId(d.getCriteria().getId());
            item.setCriteriaCode(d.getCriteria().getCriteriaCode());
            item.setTitle(d.getCriteria().getTitle());
            item.setMaxScore(d.getCriteria().getMaxScore());
            item.setRequiresProof(d.getCriteria().getRequiresProof());
            item.setStudentScore(d.getStudentScore());
            item.setClassScore(d.getClassScore());
            item.setProofUrl(d.getProofUrl());
            item.setStudentNote(d.getNote()); // Note used by student?
            return item;
        }).collect(Collectors.toList()));

        return res;
    }

    @Transactional
    public void classApprove(Long userId, Long formId, ClassApproveRequest request, String ipAddress) {
        ScoreForm form = scoreFormRepository.findById(formId).orElseThrow();
        if (form.getIsLocked()) throw new RuntimeException("409 FORM_LOCKED");
        if (form.getStatus() != ScoreFormStatus.SUBMITTED) throw new RuntimeException("422 INVALID_TRANSITION");

        List<ScoreFormDetail> details = scoreFormDetailRepository.findByScoreFormId(formId);
        Map<Long, ScoreFormDetail> detailMap = details.stream().collect(Collectors.toMap(d -> d.getCriteria().getId(), Function.identity()));

        BigDecimal classTotal = BigDecimal.ZERO;
        if (request.getDetails() != null) {
            for (ClassApproveRequest.DraftDetail d : request.getDetails()) {
                ScoreFormDetail dbDetail = detailMap.get(d.getCriteriaId());
                if (dbDetail != null && d.getClassScore() != null) {
                    if (d.getClassScore().compareTo(BigDecimal.ZERO) < 0 || d.getClassScore().compareTo(dbDetail.getCriteria().getMaxScore()) > 0) {
                        throw new RuntimeException("Score out of bounds");
                    }
                    dbDetail.setClassScore(d.getClassScore());
                    scoreFormDetailRepository.save(dbDetail);
                }
            }
        }
        
        for (ScoreFormDetail d : details) {
            BigDecimal score = d.getClassScore() != null ? d.getClassScore() : (d.getStudentScore() != null ? d.getStudentScore() : BigDecimal.ZERO);
            classTotal = classTotal.add(score);
        }
        
        if (classTotal.compareTo(new BigDecimal("100")) > 0) throw new RuntimeException("Total exceeded 100");

        form.setClassTotal(classTotal);
        String oldStatus = form.getStatus().name();
        form.setStatus(ScoreFormStatus.CLASS_APPROVED);
        scoreFormRepository.save(form);

        SignatureLog sigLog = new SignatureLog();
        sigLog.setScoreForm(form);
        sigLog.setSigner(userRepository.getReferenceById(userId));
        sigLog.setSignatureImgUrl(request.getSignatureBase64());
        sigLog.setSignOrder(vn.edu.drl.backend.enu.SignOrder.CLASS_LEADER.getValue());
        sigLog.setIpAddress(ipAddress);
        sigLog.setIsRevoked(false);
        signatureLogRepository.save(sigLog);

        auditService.log(formId, userId, "CLASS_APPROVE", oldStatus, "CLASS_APPROVED", request.getNote());

        List<User> deans = userRepository.findByDepartmentIdAndRole(form.getStudent().getDepartment().getId(), Role.DEAN);
        for (User dean : deans) {
            notificationService.createNotification(dean.getId(), "Phiếu chờ duyệt cấp Khoa", "Phiếu của " + form.getStudent().getFullName() + " đã được lớp duyệt", NotificationType.SYSTEM, "/workflow/forms/" + form.getId());
        }
    }

    @Transactional
    public void rejectForm(Long userId, Long formId, RejectRequest request) {
        ScoreForm form = scoreFormRepository.findById(formId).orElseThrow();
        if (form.getIsLocked()) throw new RuntimeException("409 FORM_LOCKED");

        String oldStatus = form.getStatus().name();
        if (form.getStatus() != ScoreFormStatus.SUBMITTED && form.getStatus() != ScoreFormStatus.CLASS_APPROVED) {
            throw new RuntimeException("422 INVALID_TRANSITION");
        }

        form.setStatus(ScoreFormStatus.REJECTED);
        form.setRejectReason(request.getRejectReason());
        scoreFormRepository.save(form);

        List<SignatureLog> logs = signatureLogRepository.findByScoreFormId(formId);
        for (SignatureLog log : logs) {
            log.setIsRevoked(true);
            signatureLogRepository.save(log);
        }

        auditService.log(formId, userId, "REJECT", oldStatus, "REJECTED", request.getRejectReason());
        
        notificationService.createNotification(form.getStudent().getId(), "Phiếu bị từ chối", "Lý do: " + request.getRejectReason(), NotificationType.SYSTEM, "/editor/my-form?semesterId=" + form.getSemester().getId());
    }

    public DeanApproveBatchResponse deanApproveBatch(Long userId, DeanApproveBatchRequest request, String ipAddress) {
        DeanApproveBatchResponse response = new DeanApproveBatchResponse();
        response.setTotal(request.getIds().size());
        List<DeanApproveBatchResponse.BatchResult> results = new ArrayList<>();
        int success = 0;
        int failed = 0;

        for (Long id : request.getIds()) {
            DeanApproveBatchResponse.BatchResult result = new DeanApproveBatchResponse.BatchResult();
            result.setScoreFormId(id);
            try {
                batchHelperService.processSingleForm(userId, id, request.getSignatureBase64(), ipAddress);
                result.setSuccess(true);
                success++;
            } catch (Exception e) {
                result.setSuccess(false);
                result.setErrorReason(e.getMessage());
                failed++;
            }
            results.add(result);
        }

        response.setSuccess(success);
        response.setFailed(failed);
        response.setResults(results);
        return response;
    }
}
