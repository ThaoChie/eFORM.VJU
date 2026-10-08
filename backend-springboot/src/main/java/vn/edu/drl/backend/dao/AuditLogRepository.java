package vn.edu.drl.backend.dao;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.edu.drl.backend.model.AuditLog;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
}
