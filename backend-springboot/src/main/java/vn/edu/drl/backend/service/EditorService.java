package vn.edu.drl.backend.service;

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


public interface EditorService {
    EditorFormResponse getMyForm(Long userId, Long semesterId);
    void saveDraft(Long userId, SaveDraftRequest request);
    String uploadProof(Long userId, Long semesterId, MultipartFile file) throws Exception;
    void submitAndSign(Long userId, SubmitFormRequest request, String ipAddress);
    void cancelDraft(Long userId, Long semesterId);
}
