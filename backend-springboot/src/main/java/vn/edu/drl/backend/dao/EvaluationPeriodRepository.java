package vn.edu.drl.backend.dao;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import vn.edu.drl.backend.enu.EvaluationPeriodStatus;
import vn.edu.drl.backend.model.EvaluationPeriod;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface EvaluationPeriodRepository extends JpaRepository<EvaluationPeriod, Long>, JpaSpecificationExecutor<EvaluationPeriod> {
    
    Optional<EvaluationPeriod> findFirstByStatusOrderByCreatedAtDesc(EvaluationPeriodStatus status);

    Optional<EvaluationPeriod> findTopByOrderByCreatedAtDesc();

    Optional<EvaluationPeriod> findFirstBySemesterIdOrderByCreatedAtDesc(Long semesterId);

    boolean existsByPeriodCode(String periodCode);

    boolean existsByPeriodCodeAndIdNot(String periodCode, Long id);

    long countByStatus(EvaluationPeriodStatus status);

    List<EvaluationPeriod> findBySemesterIdAndApplicationScopeAndStatusIn(
            Long semesterId, String applicationScope, Collection<EvaluationPeriodStatus> statuses
    );

    @Query("SELECT ep FROM EvaluationPeriod ep " +
           "WHERE (:semesterId IS NULL OR ep.semester.id = :semesterId) " +
           "  AND (:status IS NULL OR ep.status = :status) " +
           "  AND (:keyword IS NULL OR LOWER(ep.periodCode) LIKE :keyword " +
           "       OR LOWER(ep.semester.semesterName) LIKE :keyword " +
           "       OR LOWER(ep.formVersion.formName) LIKE :keyword " +
           "       OR LOWER(ep.formVersion.formCode) LIKE :keyword " +
           "       OR LOWER(ep.applicationScope) LIKE :keyword) " +
           "ORDER BY ep.createdAt DESC")
    List<EvaluationPeriod> searchPeriods(
            @Param("keyword") String keyword,
            @Param("semesterId") Long semesterId,
            @Param("status") EvaluationPeriodStatus status
    );
}
