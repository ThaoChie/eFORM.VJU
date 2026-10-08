package vn.edu.drl.backend.service.impl;

import vn.edu.drl.backend.service.*;

import vn.edu.drl.backend.service.WorkflowBatchHelperService;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import vn.edu.drl.backend.dao.*;
import vn.edu.drl.backend.enu.NotificationType;
import vn.edu.drl.backend.enu.ScoreFormStatus;
import vn.edu.drl.backend.model.*;
import vn.edu.drl.backend.service.engine.*;
import java.math.BigDecimal;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class WorkflowBatchHelperServiceImpl implements WorkflowBatchHelperService {
    private final ScoreFormRepository scoreFormRepository;
    private final ScoreFormDetailRepository scoreFormDetailRepository;
    private final UserRepository userRepository;
    private final SignatureLogRepository signatureLogRepository;
    private final AuditService auditService;
    private final NotificationService notificationService;
    private final PythonRenderClient renderClient;
    private final PdfSignatureEngine signatureEngine;
    private final PdfLockEngine lockEngine;
    private final PdfHashEngine hashEngine;
    private final StorageService storageService;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void processSingleForm(Long userId, Long formId, String signatureBase64, String ipAddress) {
        ScoreForm form = scoreFormRepository.findById(formId).orElseThrow(() -> new RuntimeException("Form not found"));
        if (form.getIsLocked()) throw new RuntimeException("409 FORM_LOCKED");
        if (form.getStatus() != ScoreFormStatus.CLASS_APPROVED) throw new RuntimeException("422 INVALID_TRANSITION");

        List<ScoreFormDetail> details = scoreFormDetailRepository.findByScoreFormId(formId);
        BigDecimal finalTotal = BigDecimal.ZERO;
        for (ScoreFormDetail d : details) {
            BigDecimal score = d.getClassScore() != null ? d.getClassScore() : (d.getStudentScore() != null ? d.getStudentScore() : BigDecimal.ZERO);
            finalTotal = finalTotal.add(score);
        }
        form.setFinalTotal(finalTotal);

        // 1. Render PDF
        Map<String, Object> data = new HashMap<>();
        data.put("studentName", form.getStudent().getFullName());
        data.put("studentCode", form.getStudent().getUserCode());
        data.put("className", form.getStudent().getClassEntity() != null ? form.getStudent().getClassEntity().getClassName() : "");
        data.put("totalScore", finalTotal);
        // Map more fields...
        byte[] pdfBytes = renderClient.renderPdf(data);

        // 2. Insert signatures
        List<SignatureLog> sigLogs = signatureLogRepository.findByScoreFormId(formId);
        byte[] studentSignature = null;
        byte[] classLeaderSignature = null;
        for (SignatureLog log : sigLogs) {
            if (log.getSignOrder() != null && log.getSignOrder() == 1) {
                try {
                    studentSignature = Base64.getDecoder().decode(log.getSignatureImgUrl().contains(",") ? log.getSignatureImgUrl().split(",")[1] : log.getSignatureImgUrl());
                } catch (Exception e) {}
            }
            if (log.getSignOrder() != null && log.getSignOrder() == 2) {
                try {
                    classLeaderSignature = Base64.getDecoder().decode(log.getSignatureImgUrl().contains(",") ? log.getSignatureImgUrl().split(",")[1] : log.getSignatureImgUrl());
                } catch (Exception e) {}
            }
        }
        
        if (studentSignature != null) {
            pdfBytes = signatureEngine.insertSignatureImage(pdfBytes, studentSignature, 100, 100);
        }
        if (classLeaderSignature != null) {
            pdfBytes = signatureEngine.insertSignatureImage(pdfBytes, classLeaderSignature, 300, 100);
        }

        byte[] deanSignature = null;
        try {
            deanSignature = Base64.getDecoder().decode(signatureBase64.contains(",") ? signatureBase64.split(",")[1] : signatureBase64);
            pdfBytes = signatureEngine.insertSignatureImage(pdfBytes, deanSignature, 500, 100);
        } catch (Exception e) {
            // Ignore signature decode error for robustness or log it
        }

        // 3. Lock PDF
        pdfBytes = lockEngine.lockPdf(pdfBytes);

        // 4. Hash PDF
        String hash = hashEngine.hashPdf(pdfBytes);

        // 5. Upload to MinIO
        String objectKey;
        try {
            objectKey = storageService.uploadBytes(pdfBytes, "signed-pdfs", "application/pdf");
        } catch (Exception e) {
            throw new RuntimeException("Upload failed: " + e.getMessage());
        }

        // 6. Update DB
        String oldStatus = form.getStatus().name();
        form.setStatus(ScoreFormStatus.DEAN_APPROVED);
        form.setIsLocked(true);
        form.setPdfFileUrl(objectKey);
        form.setPdfHashSha256(hash);
        scoreFormRepository.save(form);

        SignatureLog sigLog = new SignatureLog();
        sigLog.setScoreForm(form);
        sigLog.setSigner(userRepository.getReferenceById(userId));
        sigLog.setSignatureImgUrl(signatureBase64);
        sigLog.setSignOrder(vn.edu.drl.backend.enu.SignOrder.DEAN.getValue());
        sigLog.setIpAddress(ipAddress);
        sigLog.setIsRevoked(false);
        signatureLogRepository.save(sigLog);

        auditService.log(formId, userId, "DEAN_APPROVE", oldStatus, "DEAN_APPROVED", "Dean approved batch");

        notificationService.createNotification(form.getStudent().getId(), "Phiếu đã được phê duyệt", "Phiếu của bạn đã được Khoa phê duyệt", NotificationType.SYSTEM, "/workflow/forms/" + form.getId());
    }
}
