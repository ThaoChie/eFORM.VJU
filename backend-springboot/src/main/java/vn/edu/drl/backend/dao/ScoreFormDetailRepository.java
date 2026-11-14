package vn.edu.drl.backend.dao;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import vn.edu.drl.backend.model.ScoreFormDetail;
import java.util.List;

public interface ScoreFormDetailRepository extends JpaRepository<ScoreFormDetail, Long> {
    List<ScoreFormDetail> findByScoreFormId(Long scoreFormId);

    @Query("SELECT d FROM ScoreFormDetail d JOIN FETCH d.criteria WHERE d.scoreForm.id = :scoreFormId ORDER BY d.criteria.orderIndex ASC, d.id ASC")
    List<ScoreFormDetail> findByScoreFormIdWithCriteria(@Param("scoreFormId") Long scoreFormId);

    void deleteByScoreFormId(Long scoreFormId);
}
