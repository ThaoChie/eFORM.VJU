package vn.edu.drl.backend.dao;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.edu.drl.backend.model.ScoreForm;
import java.util.Optional;

public interface ScoreFormRepository extends JpaRepository<ScoreForm, Long> {
    Optional<ScoreForm> findByStudentIdAndSemesterId(Long studentId, Long semesterId);
    org.springframework.data.domain.Page<ScoreForm> findByStatus(vn.edu.drl.backend.enu.ScoreFormStatus status, org.springframework.data.domain.Pageable pageable);
    org.springframework.data.domain.Page<ScoreForm> findByStatusAndStudentClassEntityId(vn.edu.drl.backend.enu.ScoreFormStatus status, Long classId, org.springframework.data.domain.Pageable pageable);
    org.springframework.data.domain.Page<ScoreForm> findByStatusAndStudentDepartmentId(vn.edu.drl.backend.enu.ScoreFormStatus status, Long deptId, org.springframework.data.domain.Pageable pageable);

    long countByStatus(vn.edu.drl.backend.enu.ScoreFormStatus status);
    long countByStatusIn(java.util.Collection<vn.edu.drl.backend.enu.ScoreFormStatus> statuses);
    long countByStatusAndStudentDepartmentId(vn.edu.drl.backend.enu.ScoreFormStatus status, Long deptId);
    long countByStatusAndStudentClassEntityId(vn.edu.drl.backend.enu.ScoreFormStatus status, Long classId);
    long countByStudentClassEntityId(Long classId);
    long countByStatusInAndStudentClassEntityId(java.util.Collection<vn.edu.drl.backend.enu.ScoreFormStatus> statuses, Long classId);

    java.util.List<ScoreForm> findByStudentDepartmentId(Long deptId);
    java.util.List<ScoreForm> findByStudentClassEntityId(Long classId);
    java.util.List<ScoreForm> findByStudentDepartmentIdAndStatus(Long deptId, vn.edu.drl.backend.enu.ScoreFormStatus status);
    java.util.List<ScoreForm> findByStudentClassEntityIdAndStatus(Long classId, vn.edu.drl.backend.enu.ScoreFormStatus status);
    Optional<ScoreForm> findTopByStudentIdOrderByCreatedAtDesc(Long studentId);
    java.util.List<ScoreForm> findByStudentIdOrderByCreatedAtDesc(Long studentId);
    java.util.List<ScoreForm> findByStatusIn(java.util.Collection<vn.edu.drl.backend.enu.ScoreFormStatus> statuses);

    @org.springframework.data.jpa.repository.Query("SELECT sf.student.department.id, sf.status, COUNT(sf) FROM ScoreForm sf WHERE sf.student.department.id IS NOT NULL GROUP BY sf.student.department.id, sf.status")
    java.util.List<Object[]> countFormsByDepartmentAndStatusGrouped();

    @org.springframework.data.jpa.repository.Query("SELECT sf.student.classEntity.id, sf.status, COUNT(sf) FROM ScoreForm sf WHERE sf.student.classEntity.id IS NOT NULL GROUP BY sf.student.classEntity.id, sf.status")
    java.util.List<Object[]> countFormsByClassAndStatusGrouped();

    @org.springframework.data.jpa.repository.Query("SELECT sf FROM ScoreForm sf JOIN FETCH sf.student s LEFT JOIN FETCH s.classEntity LEFT JOIN FETCH s.department WHERE s.department.id = :deptId")
    java.util.List<ScoreForm> findByStudentDepartmentIdWithStudentAndClass(@org.springframework.data.repository.query.Param("deptId") Long deptId);

    @org.springframework.data.jpa.repository.Query("SELECT sf FROM ScoreForm sf JOIN FETCH sf.student s LEFT JOIN FETCH s.classEntity LEFT JOIN FETCH s.department WHERE s.classEntity.id = :classId")
    java.util.List<ScoreForm> findByStudentClassEntityIdWithStudentAndClass(@org.springframework.data.repository.query.Param("classId") Long classId);

    @org.springframework.data.jpa.repository.Query("SELECT sf FROM ScoreForm sf JOIN FETCH sf.student s LEFT JOIN FETCH s.classEntity LEFT JOIN FETCH s.department WHERE s.department.id = :deptId AND sf.status = :status")
    java.util.List<ScoreForm> findByStudentDepartmentIdAndStatusWithStudentAndClass(@org.springframework.data.repository.query.Param("deptId") Long deptId, @org.springframework.data.repository.query.Param("status") vn.edu.drl.backend.enu.ScoreFormStatus status);

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(s) FROM ScoreForm s WHERE s.formVersion.id = :formVersionId AND s.status != vn.edu.drl.backend.enu.ScoreFormStatus.DEAN_APPROVED")
    long countUnfinishedByFormVersionId(@org.springframework.data.repository.query.Param("formVersionId") Long formVersionId);
}
