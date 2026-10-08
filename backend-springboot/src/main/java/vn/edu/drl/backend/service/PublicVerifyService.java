package vn.edu.drl.backend.service;

import org.springframework.web.multipart.MultipartFile;
import vn.edu.drl.backend.dao.ScoreFormRepository;
import vn.edu.drl.backend.dto.response.PublicVerifyResponse;
import vn.edu.drl.backend.enu.ScoreFormStatus;
import vn.edu.drl.backend.model.ScoreForm;
import vn.edu.drl.backend.service.engine.PdfHashEngine;


public interface PublicVerifyService {
    PublicVerifyResponse getVerifyInfo(Long scoreFormId);
    boolean checkPdf(Long scoreFormId, MultipartFile file) throws Exception;
}
