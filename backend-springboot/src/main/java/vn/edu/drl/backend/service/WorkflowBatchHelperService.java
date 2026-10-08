package vn.edu.drl.backend.service;

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


public interface WorkflowBatchHelperService {
    void processSingleForm(Long userId, Long formId, String signatureBase64, String ipAddress);
}
