package vn.edu.drl.backend.service.impl;

import vn.edu.drl.backend.service.interfaces.*;

import vn.edu.drl.backend.service.interfaces.EditorService;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import vn.edu.drl.backend.dao.*;
import vn.edu.drl.backend.dto.request.SaveDraftRequest;
import vn.edu.drl.backend.dto.request.SubmitFormRequest;
import vn.edu.drl.backend.dto.response.EditorFormResponse;
import vn.edu.drl.backend.enu.EvaluationPeriodStatus;
import vn.edu.drl.backend.enu.FormVersionStatus;
import vn.edu.drl.backend.enu.NotificationType;
import vn.edu.drl.backend.enu.Role;
import vn.edu.drl.backend.enu.ScoreFormStatus;
import vn.edu.drl.backend.model.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

import vn.edu.drl.backend.dto.response.StudentHistoryResponse;

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
    private final AuditLogRepository auditLogRepository;
    private final StorageService storageService;
    private final SignatureLogRepository signatureLogRepository;
    private final NotificationService notificationService;
    private final EvaluationPeriodRepository evaluationPeriodRepository;

    @Transactional(readOnly = true)
    public EditorFormResponse getMyFormById(Long userId, Long formId) {
        ScoreForm form = scoreFormRepository.findById(formId)
                .orElseThrow(() -> new RuntimeException("Form not found"));
        if (!form.getStudent().getId().equals(userId)) {
            throw new RuntimeException("403 FORBIDDEN: You do not own this form");
        }
        return mapToEditorResponse(form);
    }

    @Transactional(readOnly = true)
    public List<StudentHistoryResponse> getMyHistory(Long userId) {
        List<ScoreForm> forms = scoreFormRepository.findByStudentIdOrderByCreatedAtDesc(userId);
        return forms.stream().map(f -> {
            StudentHistoryResponse resp = new StudentHistoryResponse();
            resp.setId(f.getId());
            if (f.getSemester() != null) {
                resp.setSemesterId(f.getSemester().getId());
                resp.setSemesterName(f.getSemester().getSemesterName());
                resp.setAcademicYear(f.getSemester().getAcademicYear());
            } else {
                resp.setSemesterName("Học kỳ");
                resp.setAcademicYear("2026 - 2027");
            }
            resp.setStudentTotal(f.getStudentTotal());
            resp.setClassTotal(f.getClassTotal());
            resp.setFinalTotal(f.getFinalTotal());

            BigDecimal total = f.getFinalTotal() != null ? f.getFinalTotal()
                    : (f.getClassTotal() != null ? f.getClassTotal()
                    : (f.getStudentTotal() != null ? f.getStudentTotal() : BigDecimal.ZERO));
            resp.setScore(total);

            if (f.getRanking() != null && !f.getRanking().trim().isEmpty()) {
                resp.setRanking(f.getRanking());
            } else {
                double val = total.doubleValue();
                if (val >= 90) resp.setRanking("Xuất sắc");
                else if (val >= 80) resp.setRanking("Tốt");
                else if (val >= 65) resp.setRanking("Khá");
                else if (val >= 50) resp.setRanking("Trung bình");
                else if (val >= 35) resp.setRanking("Yếu");
                else resp.setRanking("Kém");
            }

            resp.setStatus(f.getStatus());
            resp.setCreatedAt(f.getCreatedAt());
            resp.setUpdatedAt(f.getUpdatedAt());
            resp.setPdfFileUrl(f.getPdfFileUrl());
            return resp;
        }).collect(Collectors.toList());
    }

    private void ensureDetailsExist(ScoreForm form, Long semesterId) {
        List<ScoreFormDetail> existingDetails = scoreFormDetailRepository.findByScoreFormId(form.getId());
        if (existingDetails.isEmpty()) {
            List<Criteria> criteriaList = criteriaRepository.findBySemesterId(semesterId);
            if (criteriaList.isEmpty()) {
                criteriaList = criteriaRepository.findAll();
            }
            List<ScoreFormDetail> batchDetails = new java.util.ArrayList<>(criteriaList.size());
            for (Criteria c : criteriaList) {
                ScoreFormDetail detail = new ScoreFormDetail();
                detail.setScoreForm(form);
                detail.setCriteria(c);
                detail.setStudentScore(BigDecimal.ZERO);
                batchDetails.add(detail);
            }
            scoreFormDetailRepository.saveAll(batchDetails);
        }
    }

    private boolean hasValidException(User user, EvaluationPeriod activePeriod) {
        if (user == null || activePeriod == null || activePeriod.getExceptions() == null || activePeriod.getExceptions().trim().isEmpty()) {
            return false;
        }
        try {
            Long classId = user.getClassEntity() != null ? user.getClassEntity().getId() : null;
            Long deptId = user.getDepartment() != null ? user.getDepartment().getId() : null;
            String json = activePeriod.getExceptions();
            if (classId != null && (json.contains("\"targetId\":" + classId) || json.contains("\"targetId\":\"" + classId + "\""))) {
                return true;
            }
            if (deptId != null && (json.contains("\"targetId\":" + deptId) || json.contains("\"targetId\":\"" + deptId + "\""))) {
                return true;
            }
        } catch (Exception ignored) {}
        return false;
    }

    @Transactional
    public EditorFormResponse getMyForm(Long userId, Long semesterId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Semester semester = semesterRepository.findById(semesterId)
                .orElseThrow(() -> new RuntimeException("Semester not found"));

        Optional<ScoreForm> existingForm = scoreFormRepository.findByStudentIdAndSemesterId(userId, semesterId);

        // 1. Kiểm tra kỳ chấm ĐRL đang mở
        Optional<EvaluationPeriod> activePeriodOpt = evaluationPeriodRepository.findFirstByStatusOrderByCreatedAtDesc(EvaluationPeriodStatus.DANG_MO);
        boolean isPeriodActive = activePeriodOpt.isPresent() &&
                activePeriodOpt.get().getSemester() != null &&
                activePeriodOpt.get().getSemester().getId().equals(semesterId);

        EvaluationPeriod activePeriod = isPeriodActive ? activePeriodOpt.get() : null;

        // Nếu kỳ chấm không mở hoặc đã bị đóng
        if (activePeriod == null) {
            if (existingForm.isPresent()) {
                ScoreForm form = existingForm.get();
                ensureDetailsExist(form, semesterId);
                EditorFormResponse resp = mapToEditorResponse(form);
                resp.setIsReadOnly(true);
                resp.setIsLocked(true);
                resp.setReadOnlyReason("Kỳ đánh giá điểm rèn luyện hiện chưa mở hoặc đã kết thúc. Bạn chỉ có quyền xem phiếu.");
                return resp;
            } else {
                throw new RuntimeException("Hiện tại chưa có đợt đánh giá điểm rèn luyện nào đang mở cho học kỳ này.");
            }
        }

        // 2. Kiểm tra hạn nộp của sinh viên
        LocalDate deadline = activePeriod.getStudentDeadline() != null ? activePeriod.getStudentDeadline() : activePeriod.getSubmissionDeadline();
        boolean isExpired = false;
        if (deadline != null && LocalDate.now().isAfter(deadline)) {
            boolean hasValidException = hasValidException(user, activePeriod);
            if (!hasValidException) {
                isExpired = true;
            }
        }

        if (existingForm.isPresent()) {
            ScoreForm form = existingForm.get();
            if (form.getEvaluationPeriod() == null) {
                form.setEvaluationPeriod(activePeriod);
                scoreFormRepository.save(form);
            }
            ensureDetailsExist(form, semesterId);
            EditorFormResponse resp = mapToEditorResponse(form);
            resp.setStudentDeadline(deadline);
            if (isExpired) {
                resp.setIsExpired(true);
                resp.setIsReadOnly(true);
                resp.setReadOnlyReason("Đã hết thời hạn nộp phiếu tự đánh giá của sinh viên (" + deadline.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) + "). Cổng tự đánh giá đã đóng.");
            }
            return resp;
        }

        // Nếu chưa có phiếu mà đã hết hạn -> không cho phép tạo mới phiếu
        if (isExpired) {
            throw new RuntimeException("Đã hết thời hạn nộp phiếu tự đánh giá của sinh viên (" + deadline.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) + "). Cổng tự đánh giá đã đóng.");
        }

        FormVersion activeForm = activePeriod.getFormVersion();
        if (activeForm == null) {
            activeForm = formVersionRepository.findByFormCodeAndSemesterIdAndStatus("DRL-2026", semesterId, FormVersionStatus.ACTIVE)
                    .or(() -> formVersionRepository.findByFormCodeAndSemesterIdAndStatus("FORM_DRL", semesterId, FormVersionStatus.ACTIVE))
                    .orElseThrow(() -> new RuntimeException("No ACTIVE form template found for this semester"));
        }

        ScoreForm scoreForm = new ScoreForm();
        scoreForm.setStudent(user);
        scoreForm.setSemester(semester);
        scoreForm.setFormVersion(activeForm);
        scoreForm.setEvaluationPeriod(activePeriod);
        scoreForm.setStatus(ScoreFormStatus.DRAFT);
        scoreForm.setStudentTotal(BigDecimal.ZERO);
        ScoreForm savedForm = scoreFormRepository.save(scoreForm);

        List<Criteria> criteriaList = criteriaRepository.findBySemesterId(semesterId);
        if (criteriaList.isEmpty()) {
            criteriaList = criteriaRepository.findAll();
        }
        List<ScoreFormDetail> batchDetails = new java.util.ArrayList<>(criteriaList.size());
        for (Criteria c : criteriaList) {
            ScoreFormDetail detail = new ScoreFormDetail();
            detail.setScoreForm(savedForm);
            detail.setCriteria(c);
            detail.setStudentScore(BigDecimal.ZERO);
            batchDetails.add(detail);
        }
        scoreFormDetailRepository.saveAll(batchDetails);

        EditorFormResponse resp = mapToEditorResponse(savedForm);
        resp.setStudentDeadline(deadline);
        return resp;
    }

    @Transactional
    public void saveDraft(Long userId, SaveDraftRequest request) {
        ScoreForm form = getFormForEdit(userId, request.getSemesterId());

        List<ScoreFormDetail> details = scoreFormDetailRepository.findByScoreFormIdWithCriteria(form.getId());
        Map<Long, ScoreFormDetail> detailMapById = details.stream()
                .collect(Collectors.toMap(d -> d.getCriteria().getId(), Function.identity(), (a, b) -> a));
        Map<String, ScoreFormDetail> detailMapByCode = details.stream()
                .filter(d -> d.getCriteria() != null && d.getCriteria().getCriteriaCode() != null)
                .collect(Collectors.toMap(d -> d.getCriteria().getCriteriaCode(), Function.identity(), (a, b) -> a));

        if (request.getDetails() != null) {
            for (SaveDraftRequest.DraftDetail reqDetail : request.getDetails()) {
                ScoreFormDetail dbDetail = null;
                if (reqDetail.getCriteriaId() != null) {
                    dbDetail = detailMapById.get(reqDetail.getCriteriaId());
                }
                if (dbDetail == null && reqDetail.getCriteriaCode() != null) {
                    dbDetail = detailMapByCode.get(reqDetail.getCriteriaCode());
                }
                if (dbDetail != null) {
                    if (reqDetail.getStudentScore() != null) {
                        if (reqDetail.getStudentScore().compareTo(BigDecimal.ZERO) < 0 ||
                            reqDetail.getStudentScore().compareTo(dbDetail.getCriteria().getMaxScore()) > 0) {
                            throw new RuntimeException("Score out of bounds for criteria " + dbDetail.getCriteria().getCriteriaCode());
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

        // Kiểm tra hạn nộp của sinh viên theo BR-KCDRL-05
        EvaluationPeriod activePeriod = evaluationPeriodRepository.findFirstByStatusOrderByCreatedAtDesc(EvaluationPeriodStatus.DANG_MO).orElse(null);
        if (activePeriod != null && activePeriod.getSemester() != null && activePeriod.getSemester().getId().equals(request.getSemesterId())) {
            LocalDate deadline = activePeriod.getStudentDeadline() != null ? activePeriod.getStudentDeadline() : activePeriod.getSubmissionDeadline();
            if (deadline != null && LocalDate.now().isAfter(deadline)) {
                boolean hasValidException = false;
                User user = userRepository.findById(userId).orElse(null);
                if (user != null && activePeriod.getExceptions() != null && !activePeriod.getExceptions().trim().isEmpty()) {
                    Long classId = user.getClassEntity() != null ? user.getClassEntity().getId() : null;
                    Long deptId = user.getDepartment() != null ? user.getDepartment().getId() : null;
                    if (classId != null && activePeriod.getExceptions().contains("\"targetId\":" + classId)) {
                        hasValidException = true;
                    } else if (deptId != null && activePeriod.getExceptions().contains("\"targetId\":" + deptId)) {
                        hasValidException = true;
                    }
                }
                if (!hasValidException) {
                    throw new RuntimeException("Đã hết thời hạn nộp phiếu tự đánh giá của sinh viên (" + deadline.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) + "). Cổng nộp phiếu hiện đã đóng.");
                }
            }
        }

        List<ScoreFormDetail> details = scoreFormDetailRepository.findByScoreFormIdWithCriteria(form.getId());
        BigDecimal total = BigDecimal.ZERO;
        for (ScoreFormDetail d : details) {
            BigDecimal score = d.getStudentScore() != null ? d.getStudentScore() : BigDecimal.ZERO;
            if (Boolean.TRUE.equals(d.getCriteria().getRequiresProof()) && score.compareTo(BigDecimal.ZERO) > 0 && 
               (d.getProofUrl() == null || d.getProofUrl().isEmpty())) {
                throw new RuntimeException("Missing proof for criteria " + d.getCriteria().getCriteriaCode());
            }
            total = total.add(score);
        }

        if (total.compareTo(new BigDecimal("100")) > 0) {
            throw new RuntimeException("Total score exceeded 100");
        }

        form.setStudentTotal(total);
        
        User student = userRepository.findById(userId).orElse(null);
        String signatureImg = request.getSignatureBase64();
        if ((signatureImg == null || signatureImg.trim().isEmpty() || signatureImg.contains("CONFIRMED") || signatureImg.contains("DIGITALLY")) && student != null) {
            signatureImg = student.getSignatureSpecimenUrl();
        }
        if (student != null && student.getSignatureSpecimenUrl() == null && signatureImg != null && (signatureImg.startsWith("data:image") || signatureImg.startsWith("http"))) {
            student.setSignatureSpecimenUrl(signatureImg);
            userRepository.save(student);
        }

        SignatureLog sigLog = new SignatureLog();
        sigLog.setScoreForm(form);
        sigLog.setSigner(userRepository.getReferenceById(userId));
        sigLog.setSignatureImgUrl(signatureImg);
        sigLog.setSignOrder(vn.edu.drl.backend.enu.SignOrder.STUDENT.getValue());
        sigLog.setIpAddress(ipAddress);
        sigLog.setIsRevoked(false);
        signatureLogRepository.save(sigLog);

        String oldStatus = form.getStatus().name();
        form.setStatus(ScoreFormStatus.SUBMITTED);
        scoreFormRepository.save(form);
        auditService.log(form.getId(), userId, "SUBMIT", oldStatus, "SUBMITTED", "Student submitted form");

        if (student != null && student.getClassEntity() != null) {
            List<User> leaders = userRepository.findByClassEntityIdAndRole(student.getClassEntity().getId(), Role.CLASS_LEADER);
            for (User leader : leaders) {
                notificationService.createNotification(
                    leader.getId(), 
                    "Phiếu rèn luyện mới", 
                    "Sinh viên " + student.getFullName() + " (" + (student.getUserCode() != null ? student.getUserCode() : "") + ") đã nộp phiếu ĐRL.", 
                    NotificationType.SYSTEM, 
                    "/class-leader/review/" + form.getId()
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
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phiếu rèn luyện"));

        if (Boolean.TRUE.equals(form.getIsLocked())) {
            throw new RuntimeException("Kỳ chấm ĐRL đã được khóa sổ. Phiếu chỉ ở chế độ xem (Read-only).");
        }

        if (form.getStatus() == ScoreFormStatus.EXPIRED) {
            throw new RuntimeException("Phiếu rèn luyện đã hết hạn do kỳ chấm đã khóa sổ (EXPIRED).");
        }

        if (form.getStatus() != ScoreFormStatus.DRAFT && form.getStatus() != ScoreFormStatus.REJECTED) {
            throw new RuntimeException("Không thể chỉnh sửa phiếu ở trạng thái hiện tại: " + form.getStatus());
        }

        // BẮT BUỘC KIỂM TRA KỲ CHẤM CÒN MỞ VÀ CÒN HẠN
        EvaluationPeriod activePeriod = evaluationPeriodRepository.findFirstByStatusOrderByCreatedAtDesc(EvaluationPeriodStatus.DANG_MO)
                .orElseThrow(() -> new RuntimeException("Kỳ đánh giá điểm rèn luyện đã kết thúc hoặc chưa được mở. Cổng soạn thảo đã đóng."));

        if (activePeriod.getSemester() == null || !activePeriod.getSemester().getId().equals(semesterId)) {
            throw new RuntimeException("Học kỳ này hiện không trong đợt đánh giá rèn luyện.");
        }

        LocalDate deadline = activePeriod.getStudentDeadline() != null ? activePeriod.getStudentDeadline() : activePeriod.getSubmissionDeadline();
        if (deadline != null && LocalDate.now().isAfter(deadline)) {
            User student = form.getStudent();
            boolean hasValidException = hasValidException(student, activePeriod);
            if (!hasValidException) {
                throw new RuntimeException("Đã hết thời hạn nộp phiếu tự đánh giá của sinh viên (" + deadline.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) + "). Cổng soạn thảo đã đóng.");
            }
        }

        return form;
    }

    private EditorFormResponse mapToEditorResponse(ScoreForm form) {
        EditorFormResponse response = new EditorFormResponse();
        response.setScoreFormId(form.getId());
        if (form.getSemester() != null) {
            response.setSemesterId(form.getSemester().getId());
            response.setSemesterName(form.getSemester().getSemesterName());
        }
        if (form.getFormVersion() != null) {
            response.setFormName(form.getFormVersion().getFormName());
            response.setVersionNo(form.getFormVersion().getVersionNo());
            response.setTemplateLayoutJson(form.getFormVersion().getTemplateLayoutJson());
        }
        response.setStatus(form.getStatus());
        response.setStudentTotal(form.getStudentTotal());
        response.setClassTotal(form.getClassTotal());
        response.setIsLocked(Boolean.TRUE.equals(form.getIsLocked()));
        response.setIsExpired(form.getStatus() == ScoreFormStatus.EXPIRED);

        // Kiểm tra kỳ đánh giá điểm rèn luyện liên kết
        EvaluationPeriod period = form.getEvaluationPeriod();
        if (period == null && form.getSemester() != null) {
            period = evaluationPeriodRepository.findFirstBySemesterIdOrderByCreatedAtDesc(form.getSemester().getId()).orElse(null);
        }

        if (period != null) {
            LocalDate deadline = period.getStudentDeadline() != null ? period.getStudentDeadline() : period.getSubmissionDeadline();
            response.setStudentDeadline(deadline);

            if (period.getStatus() == EvaluationPeriodStatus.DA_DONG || Boolean.TRUE.equals(period.getIsLocked())) {
                response.setIsReadOnly(true);
                response.setIsLocked(true);
                response.setReadOnlyReason("Kỳ đánh giá điểm rèn luyện đã kết thúc và khóa sổ. Cổng tự đánh giá đã đóng và phiếu chỉ ở chế độ xem.");
            } else if (period.getStatus() == EvaluationPeriodStatus.VO_HIEU_HOA) {
                response.setIsReadOnly(true);
                response.setIsLocked(true);
                response.setReadOnlyReason("Kỳ đánh giá điểm rèn luyện này hiện đang bị vô hiệu hóa. Cổng tự đánh giá tạm thời ngừng nhận thao tác.");
            } else if (period.getStatus() == EvaluationPeriodStatus.CHUA_MO) {
                response.setIsReadOnly(true);
                response.setReadOnlyReason("Kỳ đánh giá điểm rèn luyện này chưa được kích hoạt mở.");
            } else if (period.getStatus() == EvaluationPeriodStatus.DANG_MO) {
                if (deadline != null && LocalDate.now().isAfter(deadline)) {
                    boolean hasExc = hasValidException(form.getStudent(), period);
                    if (!hasExc) {
                        response.setIsReadOnly(true);
                        response.setIsExpired(true);
                        response.setReadOnlyReason("Đã hết thời hạn sinh viên tự đánh giá (Hạn chót: " + deadline.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) + "). Cổng tự đánh giá đã đóng.");
                    }
                }
            }
        } else {
            response.setIsReadOnly(true);
            response.setReadOnlyReason("Hiện tại không có kỳ đánh giá điểm rèn luyện nào đang mở cho học kỳ này.");
        }

        if (Boolean.TRUE.equals(form.getIsLocked()) || form.getStatus() == ScoreFormStatus.EXPIRED || (form.getStatus() != ScoreFormStatus.DRAFT && form.getStatus() != ScoreFormStatus.REJECTED)) {
            response.setIsReadOnly(true);
            if (response.getReadOnlyReason() == null) {
                if (form.getStatus() == ScoreFormStatus.EXPIRED) {
                    response.setReadOnlyReason("Phiếu rèn luyện đã hết hạn do kỳ chấm đã khóa sổ.");
                } else if (Boolean.TRUE.equals(form.getIsLocked())) {
                    response.setReadOnlyReason("Kỳ đánh giá điểm rèn luyện đã khóa sổ.");
                } else if (form.getStatus() != ScoreFormStatus.DRAFT && form.getStatus() != ScoreFormStatus.REJECTED) {
                    response.setReadOnlyReason("Phiếu đã được nộp và chuyển lên cấp thẩm định, không thể chỉnh sửa.");
                }
            }
        }

        User st = form.getStudent();
        vn.edu.drl.backend.model.ClassEntity c = (st != null) ? st.getClassEntity() : null;
        response.setStudentName(st != null ? st.getFullName() : "");
        response.setStudentCode(st != null ? st.getUserCode() : "");
        response.setDob(st != null ? st.getDob() : null);
        response.setClassName(c != null ? c.getClassName() : "");
        response.setMajorName(c != null && c.getMajor() != null ? c.getMajor().getMajorName() : (st != null && st.getMajor() != null ? st.getMajor().getMajorName() : "Công nghệ Thông tin"));
        response.setDepartmentName(c != null && c.getDepartment() != null ? c.getDepartment().getDeptName() : (st != null && st.getDepartment() != null ? st.getDepartment().getDeptName() : "Khoa Công nghệ Thông tin"));
        response.setAcademicCohort(c != null && c.getAcademicCohort() != null && !c.getAcademicCohort().trim().isEmpty() ? c.getAcademicCohort() : (st != null && st.getAcademicCohort() != null ? st.getAcademicCohort() : "2023 - 2027"));

        // Populate signatures
        List<SignatureLog> sigLogs = signatureLogRepository.findByScoreFormId(form.getId());
        for (SignatureLog sl : sigLogs) {
            if (Boolean.TRUE.equals(sl.getIsRevoked())) continue;
            if (sl.getSignOrder() != null && sl.getSignOrder() == 1) {
                String img = sl.getSignatureImgUrl();
                if (img != null && !img.contains("CONFIRMED") && !img.contains("DIGITALLY") && !img.trim().isEmpty()) {
                    response.setStudentSignature(vn.edu.drl.backend.service.engine.ImageConversionUtils.ensureStandardWebImage(img));
                }
            } else if (sl.getSignOrder() != null && sl.getSignOrder() == 2) {
                String img = sl.getSignatureImgUrl();
                if (img != null && !img.contains("CONFIRMED") && !img.contains("DIGITALLY") && !img.trim().isEmpty()) {
                    response.setClassSignature(vn.edu.drl.backend.service.engine.ImageConversionUtils.ensureStandardWebImage(img));
                }
                if (sl.getSigner() != null) {
                    response.setClassLeaderName(sl.getSigner().getFullName());
                }
            } else if ((sl.getSignOrder() != null && sl.getSignOrder() == 3) || sl.getSignerRole() == Role.DEAN) {
                String img = sl.getSignatureImgUrl();
                if (img != null && !img.contains("CONFIRMED") && !img.contains("DIGITALLY") && !img.trim().isEmpty()) {
                    response.setDeanSignature(vn.edu.drl.backend.service.engine.ImageConversionUtils.ensureStandardWebImage(img));
                }
                if (sl.getSigner() != null) {
                    response.setDeanName(sl.getSigner().getFullName());
                }
            }
        }
        if ((response.getStudentSignature() == null || response.getStudentSignature().trim().isEmpty()) && form.getStudent() != null) {
            response.setStudentSignature(vn.edu.drl.backend.service.engine.ImageConversionUtils.ensureStandardWebImage(form.getStudent().getSignatureSpecimenUrl()));
        }
        if (form.getStatus() == ScoreFormStatus.DEAN_APPROVED && (response.getDeanSignature() == null || response.getDeanSignature().trim().isEmpty())) {
            String dName = (response.getDeanName() != null && !response.getDeanName().trim().isEmpty()) ? response.getDeanName() : "Trưởng Khoa CNTT";
            response.setDeanSignature(vn.edu.drl.backend.service.engine.ImageConversionUtils.generateSpecimenPngBase64(
                dName,
                "Trưởng Khoa",
                new java.awt.Color(136, 19, 55)
            ));
        }

        if (form.getStatus() == ScoreFormStatus.REJECTED) {
            response.setRejectReason(form.getRejectReason());
            response.setRejectedAt(form.getUpdatedAt() != null ? form.getUpdatedAt() : form.getCreatedAt());

            // Query audit logs to determine who rejected
            List<AuditLog> auditLogs = auditLogRepository.findByScoreFormIdOrderByCreatedAtDesc(form.getId());
            Optional<AuditLog> rejectLog = auditLogs.stream()
                    .filter(a -> "REJECT".equalsIgnoreCase(a.getAction()) || ScoreFormStatus.REJECTED.name().equalsIgnoreCase(a.getToStatus()))
                    .findFirst();

            if (rejectLog.isPresent()) {
                AuditLog log = rejectLog.get();
                response.setRejectedAt(log.getCreatedAt());
                if (log.getUser() != null) {
                    Role r = log.getUser().getRole();
                    if (r == Role.DEAN) {
                        response.setRejectedBy("Khoa / Ban Đánh giá (" + log.getUser().getFullName() + ")");
                    } else if (r == Role.CLASS_LEADER || r == Role.CLASS_DEPUTY) {
                        response.setRejectedBy("Ban cán sự Lớp (" + log.getUser().getFullName() + ")");
                    } else {
                        response.setRejectedBy(log.getUser().getFullName());
                    }
                } else {
                    response.setRejectedBy("Ban cán sự Lớp");
                }
            } else {
                response.setRejectedBy("Ban cán sự Lớp");
            }
        }

        List<ScoreFormDetail> details = scoreFormDetailRepository.findByScoreFormIdWithCriteria(form.getId());
        List<EditorFormResponse.EditorFormDetailResponse> detailResponses = details.stream().map(d -> {
            EditorFormResponse.EditorFormDetailResponse dr = new EditorFormResponse.EditorFormDetailResponse();
            dr.setCriteriaId(d.getCriteria().getId());
            dr.setCriteriaCode(d.getCriteria().getCriteriaCode());
            dr.setTitle(d.getCriteria().getTitle());
            dr.setMaxScore(d.getCriteria().getMaxScore());
            dr.setRequiresProof(d.getCriteria().getRequiresProof());
            dr.setStudentScore(d.getStudentScore());
            dr.setClassScore(d.getClassScore());
            dr.setProofUrl(d.getProofUrl());
            dr.setNote(d.getNote());
            return dr;
        }).collect(Collectors.toList());

        response.setDetails(detailResponses);
        return response;
    }
}
