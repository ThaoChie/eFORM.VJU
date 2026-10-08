package vn.edu.drl.backend.service;

import vn.edu.drl.backend.dao.AuditLogRepository;
import vn.edu.drl.backend.dao.ScoreFormRepository;
import vn.edu.drl.backend.dao.UserRepository;
import vn.edu.drl.backend.model.AuditLog;
import vn.edu.drl.backend.model.ScoreForm;
import vn.edu.drl.backend.model.User;


public interface AuditService {
    void log(Long scoreFormId, Long userId, String action, String fromStatus, String toStatus, String note);
}
