package vn.edu.drl.backend.dao;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.edu.drl.backend.model.ScoreForm;
import java.util.Optional;

public interface ScoreFormRepository extends JpaRepository<ScoreForm, Long> {
    Optional<ScoreForm> findByStudentIdAndSemesterId(Long studentId, Long semesterId);
    org.springframework.data.domain.Page<ScoreForm> findByStatusAndStudentClassEntityId(vn.edu.drl.backend.enu.ScoreFormStatus status, Long classId, org.springframework.data.domain.Pageable pageable);
    org.springframework.data.domain.Page<ScoreForm> findByStatusAndStudentDepartmentId(vn.edu.drl.backend.enu.ScoreFormStatus status, Long deptId, org.springframework.data.domain.Pageable pageable);
}
