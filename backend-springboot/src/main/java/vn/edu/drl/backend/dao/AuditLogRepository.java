package vn.edu.drl.backend.dao;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.edu.drl.backend.model.AuditLog;
import java.util.List;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    List<AuditLog> findByScoreFormIdOrderByCreatedAtDesc(Long scoreFormId);
    List<AuditLog> findByEvaluationPeriodIdOrderByCreatedAtDesc(Long periodId);
}

