package vn.edu.drl.backend.dao;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.edu.drl.backend.model.FormVersion;
import vn.edu.drl.backend.enu.FormVersionStatus;
import java.util.List;
import java.util.Optional;

public interface FormVersionRepository extends JpaRepository<FormVersion, Long> {
    Optional<FormVersion> findByFormCodeAndSemesterIdAndStatus(String formCode, Long semesterId, FormVersionStatus status);
    List<FormVersion> findByFormCodeAndSemesterId(String formCode, Long semesterId);
    Optional<FormVersion> findTopByFormCodeAndSemesterIdOrderByCreatedAtDesc(String formCode, Long semesterId);
}
