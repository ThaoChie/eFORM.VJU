package vn.edu.drl.backend.service.impl;

import vn.edu.drl.backend.service.*;

import vn.edu.drl.backend.service.AuditService;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.drl.backend.dao.AuditLogRepository;
import vn.edu.drl.backend.dao.ScoreFormRepository;
import vn.edu.drl.backend.dao.UserRepository;
import vn.edu.drl.backend.model.AuditLog;
import vn.edu.drl.backend.model.ScoreForm;
import vn.edu.drl.backend.model.User;

@Service
@RequiredArgsConstructor
public class AuditServiceImpl implements AuditService {
    private final AuditLogRepository auditLogRepository;
    private final ScoreFormRepository scoreFormRepository;
    private final UserRepository userRepository;

    @Transactional
    public void log(Long scoreFormId, Long userId, String action, String fromStatus, String toStatus, String note) {
        AuditLog auditLog = new AuditLog();
        ScoreForm scoreForm = scoreFormRepository.getReferenceById(scoreFormId);
        User user = userRepository.getReferenceById(userId);

        auditLog.setScoreForm(scoreForm);
        auditLog.setUser(user);
        auditLog.setAction(action);
        auditLog.setFromStatus(fromStatus);
        auditLog.setToStatus(toStatus);
        auditLog.setNote(note);

        auditLogRepository.save(auditLog);
    }
}
