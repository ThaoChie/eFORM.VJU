package vn.edu.drl.backend.dao;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.edu.drl.backend.model.ScoreFormDetail;
import java.util.List;

public interface ScoreFormDetailRepository extends JpaRepository<ScoreFormDetail, Long> {
    List<ScoreFormDetail> findByScoreFormId(Long scoreFormId);
    void deleteByScoreFormId(Long scoreFormId);
}
