package vn.edu.drl.backend.dao;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.edu.drl.backend.model.SignatureLog;

import java.util.List;

public interface SignatureLogRepository extends JpaRepository<SignatureLog, Long> {
    List<SignatureLog> findByScoreFormId(Long scoreFormId);
}
