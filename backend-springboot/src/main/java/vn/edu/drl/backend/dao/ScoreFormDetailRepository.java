package vn.edu.drl.backend.dao;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import vn.edu.drl.backend.model.ScoreFormDetail;
import java.util.List;

public interface ScoreFormDetailRepository extends JpaRepository<ScoreFormDetail, Long> {
    @Query("SELECT d FROM ScoreFormDetail d LEFT JOIN FETCH d.criteria c WHERE d.scoreForm.id = :scoreFormId ORDER BY COALESCE(c.orderIndex, 9999) ASC, c.criteriaCode ASC, d.id ASC")
    List<ScoreFormDetail> findByScoreFormId(@Param("scoreFormId") Long scoreFormId);

    @Query("SELECT d FROM ScoreFormDetail d LEFT JOIN FETCH d.criteria c WHERE d.scoreForm.id = :scoreFormId ORDER BY COALESCE(c.orderIndex, 9999) ASC, c.criteriaCode ASC, d.id ASC")
    List<ScoreFormDetail> findByScoreFormIdWithCriteria(@Param("scoreFormId") Long scoreFormId);

    void deleteByScoreFormId(Long scoreFormId);
}
