package vn.edu.drl.backend.service.impl;

import vn.edu.drl.backend.service.*;

import vn.edu.drl.backend.service.PublicVerifyService;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import vn.edu.drl.backend.dao.ScoreFormRepository;
import vn.edu.drl.backend.dto.response.PublicVerifyResponse;
import vn.edu.drl.backend.enu.ScoreFormStatus;
import vn.edu.drl.backend.model.ScoreForm;
import vn.edu.drl.backend.service.engine.PdfHashEngine;

@Service
@RequiredArgsConstructor
public class PublicVerifyServiceImpl implements PublicVerifyService {

    private final ScoreFormRepository scoreFormRepository;
    private final PdfHashEngine hashEngine;

    public PublicVerifyResponse getVerifyInfo(Long scoreFormId) {
        ScoreForm form = scoreFormRepository.findById(scoreFormId)
                .orElseThrow(() -> new RuntimeException("Form not found"));

        if (form.getStatus() != ScoreFormStatus.DEAN_APPROVED) {
            throw new RuntimeException("Form is not yet approved");
        }

        PublicVerifyResponse res = new PublicVerifyResponse();
        res.setStatus(form.getStatus().name());
        res.setApprovedAt(form.getUpdatedAt() != null ? form.getUpdatedAt() : form.getCreatedAt());
        res.setHash(form.getPdfHashSha256());
        
        // Mask student code for privacy
        String code = form.getStudent().getUserCode();
        if (code != null && code.length() > 3) {
            code = code.substring(0, 3) + "****";
        }
        res.setStudentCodeMasked(code);

        return res;
    }

    public boolean checkPdf(Long scoreFormId, MultipartFile file) throws Exception {
        ScoreForm form = scoreFormRepository.findById(scoreFormId)
                .orElseThrow(() -> new RuntimeException("Form not found"));

        if (form.getStatus() != ScoreFormStatus.DEAN_APPROVED || form.getPdfHashSha256() == null) {
            return false;
        }

        String computedHash = hashEngine.hashPdf(file.getBytes());
        return form.getPdfHashSha256().equals(computedHash);
    }
}
