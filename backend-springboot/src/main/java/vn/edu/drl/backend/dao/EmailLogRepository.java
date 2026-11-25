package vn.edu.drl.backend.dao;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.edu.drl.backend.model.EmailLog;

import java.util.List;

public interface EmailLogRepository extends JpaRepository<EmailLog, Long> {
    List<EmailLog> findByRecipientEmailOrderByCreatedAtDesc(String recipientEmail);
    List<EmailLog> findTop50ByOrderByCreatedAtDesc();
}
