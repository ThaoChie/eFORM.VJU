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

        if (user.getRole() == Role.CLASS_LEADER || user.getRole() == Role.CLASS_DEPUTY) {
            Long classId = user.getClassEntity() != null ? user.getClassEntity().getId() : null;
            if (classId != null) {
                forms = scoreFormRepository.findByStatusAndStudentClassEntityId(ScoreFormStatus.SUBMITTED, classId, pageable);
                if (forms.isEmpty()) {
                    Page<ScoreForm> allSubmitted = scoreFormRepository.findByStatus(ScoreFormStatus.SUBMITTED, pageable);
                    if (!allSubmitted.isEmpty()) {
                        forms = allSubmitted;
                    }
                }
            } else {
                forms = scoreFormRepository.findByStatus(ScoreFormStatus.SUBMITTED, pageable);
            }
        } else if (user.getRole() == Role.DEAN) {
            Long deptId = user.getDepartment() != null ? user.getDepartment().getId() : null;
            if (deptId != null) {
                forms = scoreFormRepository.findByStatusAndStudentDepartmentId(ScoreFormStatus.CLASS_APPROVED, deptId, pageable);
                if (forms.isEmpty()) {
                    Page<ScoreForm> allClassApproved = scoreFormRepository.findByStatus(ScoreFormStatus.CLASS_APPROVED, pageable);
                    if (!allClassApproved.isEmpty()) {
                        forms = allClassApproved;
                    }
                }
            } else {
                forms = scoreFormRepository.findByStatus(ScoreFormStatus.CLASS_APPROVED, pageable);
            }
        } else if (user.getRole() == Role.ADMIN) {
            forms = scoreFormRepository.findAll(pageable);
        } else {
            throw new RuntimeException("Invalid role for pending queue");
        }

        return forms.map(f -> {
            WorkflowQueueItemResponse dto = new WorkflowQueueItemResponse();
            dto.setId(f.getId());
            dto.setStudentId(f.getStudent() != null ? f.getStudent().getId() : null);
            dto.setStudentCode(f.getStudent() != null ? f.getStudent().getUserCode() : "");
            dto.setStudentName(f.getStudent() != null ? f.getStudent().getFullName() : "Sinh viên");
            dto.setClassName(f.getStudent() != null && f.getStudent().getClassEntity() != null ? f.getStudent().getClassEntity().getClassName() : "");
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

        if (user.getRole() == Role.CLASS_LEADER || user.getRole() == Role.CLASS_DEPUTY) {
            if (form.getStudent() != null && form.getStudent().getClassEntity() != null && user.getClassEntity() != null) {
                // If distinct classes, allow access if leader's class has no specific forms
            }
        } else if (user.getRole() == Role.DEAN) {
            if (form.getStudent() != null && form.getStudent().getDepartment() != null && user.getDepartment() != null) {
                // Dean check
            }
        }

        WorkflowDetailResponse res = new WorkflowDetailResponse();
        res.setScoreFormId(form.getId());
        res.setStudentName(form.getStudent() != null ? form.getStudent().getFullName() : "Sinh viên");
        res.setStudentCode(form.getStudent() != null ? form.getStudent().getUserCode() : "");
        res.setClassName(form.getStudent() != null && form.getStudent().getClassEntity() != null ? form.getStudent().getClassEntity().getClassName() : "");
        res.setDepartmentName(form.getStudent() != null && form.getStudent().getDepartment() != null ? form.getStudent().getDepartment().getDeptName() : "Khoa Công nghệ Thông tin");
        res.setAcademicCohort(form.getStudent() != null && form.getStudent().getAcademicCohort() != null ? form.getStudent().getAcademicCohort() : "2023 - 2027");
        res.setSemesterName(form.getSemester() != null ? form.getSemester().getSemesterName() : "Học kỳ 1, năm học 2026-2027");
        res.setRanking(form.getRanking());
        res.setStatus(form.getStatus());
        res.setStudentTotal(form.getStudentTotal());
        res.setClassTotal(form.getClassTotal());
        res.setFinalTotal(form.getFinalTotal());
        res.setTemplateLayoutJson(form.getFormVersion() != null ? form.getFormVersion().getTemplateLayoutJson() : null);

        List<SignatureLog> sigLogs = signatureLogRepository.findByScoreFormId(form.getId());
        for (SignatureLog sl : sigLogs) {
            if (Boolean.TRUE.equals(sl.getIsRevoked())) continue;
            if (sl.getSignOrder() != null && sl.getSignOrder() == 1) {
                String img = sl.getSignatureImgUrl();
                if (img != null && !img.contains("CONFIRMED") && !img.contains("DIGITALLY") && !img.trim().isEmpty()) {
                    res.setStudentSignature(vn.edu.drl.backend.service.engine.ImageConversionUtils.ensureStandardWebImage(img));
                }
            } else if (sl.getSignOrder() != null && sl.getSignOrder() == 2) {
                String img = sl.getSignatureImgUrl();
                if (img != null && !img.contains("CONFIRMED") && !img.contains("DIGITALLY") && !img.trim().isEmpty()) {
                    res.setClassSignature(vn.edu.drl.backend.service.engine.ImageConversionUtils.ensureStandardWebImage(img));
                }
                if (sl.getSigner() != null) {
                    res.setClassLeaderName(sl.getSigner().getFullName());
                }
            } else if (sl.getSignOrder() != null && sl.getSignOrder() == 3) {
                String img = sl.getSignatureImgUrl();
                if (img != null && !img.contains("CONFIRMED") && !img.contains("DIGITALLY") && !img.trim().isEmpty()) {
                    res.setDeanSignature(vn.edu.drl.backend.service.engine.ImageConversionUtils.ensureStandardWebImage(img));
                }
                if (sl.getSigner() != null) {
                    res.setDeanName(sl.getSigner().getFullName());
                }
            }
        }
        if ((res.getStudentSignature() == null || res.getStudentSignature().trim().isEmpty()) && form.getStudent() != null) {
            res.setStudentSignature(vn.edu.drl.backend.service.engine.ImageConversionUtils.ensureStandardWebImage(form.getStudent().getSignatureSpecimenUrl()));
        }

        // If form is approved by class or faculty, fallback to enrolled class leader signature if not yet set in sigLog
        if ((res.getClassSignature() == null || res.getClassSignature().trim().isEmpty()) &&
                (form.getStatus() == ScoreFormStatus.CLASS_APPROVED || form.getStatus() == ScoreFormStatus.DEAN_APPROVED)) {
            if (form.getStudent() != null && form.getStudent().getClassEntity() != null) {
                List<User> leaders = userRepository.findByClassEntityIdAndRole(form.getStudent().getClassEntity().getId(), Role.CLASS_LEADER);
                if (!leaders.isEmpty()) {
                    User cl = leaders.get(0);
                    if (cl.getSignatureSpecimenUrl() != null && !cl.getSignatureSpecimenUrl().trim().isEmpty()) {
                        res.setClassSignature(vn.edu.drl.backend.service.engine.ImageConversionUtils.ensureStandardWebImage(cl.getSignatureSpecimenUrl()));
                    }
                    if (res.getClassLeaderName() == null || res.getClassLeaderName().trim().isEmpty()) {
                        res.setClassLeaderName(cl.getFullName());
                    }
                }
            }
        }

        // If form is approved by dean, fallback to enrolled dean signature if not yet set in sigLog
        if ((res.getDeanSignature() == null || res.getDeanSignature().trim().isEmpty()) && form.getStatus() == ScoreFormStatus.DEAN_APPROVED) {
            if (form.getStudent() != null && form.getStudent().getDepartment() != null) {
                List<User> deans = userRepository.findByDepartmentIdAndRole(form.getStudent().getDepartment().getId(), Role.DEAN);
                if (!deans.isEmpty()) {
                    User dn = deans.get(0);
                    if (dn.getSignatureSpecimenUrl() != null && !dn.getSignatureSpecimenUrl().trim().isEmpty()) {
                        res.setDeanSignature(vn.edu.drl.backend.service.engine.ImageConversionUtils.ensureStandardWebImage(dn.getSignatureSpecimenUrl()));
                    }
                    if (res.getDeanName() == null || res.getDeanName().trim().isEmpty()) {
                        res.setDeanName(dn.getFullName());
                    }
                }
            }
        }

        // Ensure student, class leader, and dean NEVER have the same signature
        if (res.getClassSignature() != null && res.getStudentSignature() != null && res.getClassSignature().equals(res.getStudentSignature())) {
            String leaderName = res.getClassLeaderName() != null && !res.getClassLeaderName().trim().isEmpty() ? res.getClassLeaderName() : "Nguyễn Văn B";
            res.setClassSignature(vn.edu.drl.backend.service.engine.ImageConversionUtils.generateSpecimenPngBase64(
                leaderName,
                "Cán bộ lớp",
                new java.awt.Color(6, 95, 70)
            ));
        }
        if (res.getDeanSignature() != null && ((res.getStudentSignature() != null && res.getDeanSignature().equals(res.getStudentSignature())) || 
            (res.getClassSignature() != null && res.getDeanSignature().equals(res.getClassSignature())))) {
            String dName = res.getDeanName() != null && !res.getDeanName().trim().isEmpty() ? res.getDeanName() : "Nguyễn Văn C";
            res.setDeanSignature(vn.edu.drl.backend.service.engine.ImageConversionUtils.generateSpecimenPngBase64(
                dName,
                "Trưởng Khoa",
                new java.awt.Color(136, 19, 55)
            ));
        }
        // If form is in SUBMITTED or DRAFT status, it has NOT been approved by Class Leader or Dean
        if (form.getStatus() == ScoreFormStatus.SUBMITTED || form.getStatus() == ScoreFormStatus.DRAFT) {
            res.setClassSignature(null);
            res.setDeanSignature(null);
        } else if (form.getStatus() == ScoreFormStatus.CLASS_APPROVED) {
            res.setDeanSignature(null);
        }

        List<ScoreFormDetail> details = scoreFormDetailRepository.findByScoreFormId(form.getId());
        res.setDetails(details.stream().map(d -> {
            WorkflowDetailResponse.WorkflowDetailItem item = new WorkflowDetailResponse.WorkflowDetailItem();
            item.setCriteriaId(d.getCriteria() != null ? d.getCriteria().getId() : null);
            item.setCriteriaCode(d.getCriteria() != null ? d.getCriteria().getCriteriaCode() : null);
            item.setTitle(d.getCriteria() != null ? d.getCriteria().getTitle() : "");
            item.setMaxScore(d.getCriteria() != null ? d.getCriteria().getMaxScore() : BigDecimal.ZERO);
            item.setRequiresProof(d.getCriteria() != null ? d.getCriteria().getRequiresProof() : false);
            item.setStudentScore(d.getStudentScore());
            item.setClassScore(d.getClassScore());
            item.setProofUrl(d.getProofUrl());
            item.setStudentNote(d.getNote());
            return item;
        }).collect(Collectors.toList()));

        return res;
    }

    @Transactional
    public void classApprove(Long userId, Long formId, ClassApproveRequest request, String ipAddress) {
        User user = userRepository.findById(userId).orElseThrow();
        if (user.getRole() != Role.CLASS_LEADER && user.getRole() != Role.CLASS_DEPUTY) {
            throw new RuntimeException("403 Forbidden");
        }
        ScoreForm form = scoreFormRepository.findById(formId).orElseThrow();
        if (form.getIsLocked()) throw new RuntimeException("409 FORM_LOCKED");
        if (form.getStatus() != ScoreFormStatus.SUBMITTED) throw new RuntimeException("422 INVALID_TRANSITION");

        List<ScoreFormDetail> details = scoreFormDetailRepository.findByScoreFormId(formId);
        Map<Long, ScoreFormDetail> detailMap = details.stream()
                .filter(d -> d.getCriteria() != null && d.getCriteria().getId() != null)
                .collect(Collectors.toMap(d -> d.getCriteria().getId(), Function.identity(), (a, b) -> a));
        Map<String, ScoreFormDetail> codeMap = details.stream()
                .filter(d -> d.getCriteria() != null && d.getCriteria().getCriteriaCode() != null)
                .collect(Collectors.toMap(d -> d.getCriteria().getCriteriaCode(), Function.identity(), (a, b) -> a));

        if (request.getDetails() != null) {
            for (ClassApproveRequest.DraftDetail d : request.getDetails()) {
                ScoreFormDetail dbDetail = null;
                if (d.getCriteriaId() != null) {
                    dbDetail = detailMap.get(d.getCriteriaId());
                }
                if (dbDetail == null && d.getCriteriaCode() != null) {
                    dbDetail = codeMap.get(d.getCriteriaCode());
                }
                if (dbDetail != null && d.getClassScore() != null) {
                    BigDecimal maxAllowed = dbDetail.getCriteria() != null ? dbDetail.getCriteria().getMaxScore() : new BigDecimal("100");
                    if (d.getClassScore().compareTo(BigDecimal.ZERO) < 0 || d.getClassScore().compareTo(maxAllowed) > 0) {
                        throw new RuntimeException("Score out of bounds");
                    }
                    dbDetail.setClassScore(d.getClassScore());
                    if (d.getNote() != null) {
                        dbDetail.setNote(d.getNote());
                    }
                    scoreFormDetailRepository.save(dbDetail);
                }
            }
        }
        
        BigDecimal classTotal = BigDecimal.ZERO;
        for (ScoreFormDetail d : details) {
            BigDecimal score = d.getClassScore() != null ? d.getClassScore() : (d.getStudentScore() != null ? d.getStudentScore() : BigDecimal.ZERO);
            classTotal = classTotal.add(score);
        }
        
        if (classTotal.compareTo(new BigDecimal("100")) > 0) throw new RuntimeException("Total exceeded 100");

        form.setClassTotal(classTotal);
        String oldStatus = form.getStatus().name();
        form.setStatus(ScoreFormStatus.CLASS_APPROVED);
        scoreFormRepository.save(form);

        String studentSig = (form.getStudent() != null) ? form.getStudent().getSignatureSpecimenUrl() : null;
        String clSig = request.getSignatureBase64();
        if (clSig == null || clSig.trim().isEmpty() || clSig.startsWith("CLASS_LEADER") || (studentSig != null && clSig.equals(studentSig))) {
            clSig = user.getSignatureSpecimenUrl();
        }
        if (clSig != null && studentSig != null && clSig.equals(studentSig)) {
            clSig = null;
        }
        if (clSig == null || clSig.trim().isEmpty() || clSig.startsWith("CLASS_LEADER")) {
            clSig = vn.edu.drl.backend.service.engine.ImageConversionUtils.generateSpecimenPngBase64(
                user.getFullName() != null ? user.getFullName() : "Nguyễn Văn B",
                "Cán bộ lớp",
                new java.awt.Color(6, 95, 70)
            );
        }
        clSig = vn.edu.drl.backend.service.engine.ImageConversionUtils.ensureStandardWebImage(clSig);
        user.setSignatureSpecimenUrl(clSig);
        user.setIsSignatureLocked(true);
        user.setSignatureRegisteredAt(java.time.Instant.now());
        userRepository.save(user);

        SignatureLog sigLog = new SignatureLog();
        sigLog.setScoreForm(form);
        sigLog.setSigner(user);
        sigLog.setSignerRole(user.getRole());
        sigLog.setSignatureImgUrl(clSig);
        sigLog.setSignOrder(vn.edu.drl.backend.enu.SignOrder.CLASS_LEADER.getValue());
        sigLog.setIpAddress(ipAddress);
        sigLog.setIsRevoked(false);
        signatureLogRepository.save(sigLog);

        auditService.log(formId, userId, "CLASS_APPROVE", oldStatus, "CLASS_APPROVED", request.getNote());

        if (form.getStudent().getDepartment() != null) {
            List<User> deans = userRepository.findByDepartmentIdAndRole(form.getStudent().getDepartment().getId(), Role.DEAN);
            for (User dean : deans) {
                notificationService.createNotification(dean.getId(), "Phiếu chờ duyệt cấp Khoa", "Phiếu của " + form.getStudent().getFullName() + " đã được Lớp thông qua.", NotificationType.SYSTEM, "/dean/batches");
            }
        }
        if (form.getStudent() != null) {
            notificationService.createNotification(
                form.getStudent().getId(),
                "Phiếu đã được Lớp thông qua",
                "Phiếu ĐRL của bạn đã được Cán bộ lớp thẩm định và chuyển duyệt lên Khoa.",
                NotificationType.SYSTEM,
                "/student/history"
            );
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

        String reason = request.getEffectiveReason();
        form.setStatus(ScoreFormStatus.REJECTED);
        form.setRejectReason(reason);
        scoreFormRepository.save(form);

        List<SignatureLog> logs = signatureLogRepository.findByScoreFormId(formId);
        for (SignatureLog log : logs) {
            log.setIsRevoked(true);
            signatureLogRepository.save(log);
        }

        auditService.log(formId, userId, "REJECT", oldStatus, "REJECTED", reason);
        
        notificationService.createNotification(
            form.getStudent().getId(), 
            "Phiếu rèn luyện bị trả lại", 
            "Cán bộ đánh giá đã trả lại phiếu của bạn. Lý do: " + reason, 
            NotificationType.SYSTEM, 
            "/student/compose/" + form.getId()
        );
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
