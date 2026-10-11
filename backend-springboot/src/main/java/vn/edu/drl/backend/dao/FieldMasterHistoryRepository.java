package vn.edu.drl.backend.dao;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.edu.drl.backend.model.FieldMasterHistory;

import java.util.List;

@Repository
public interface FieldMasterHistoryRepository extends JpaRepository<FieldMasterHistory, Long> {
    List<FieldMasterHistory> findByFieldIdOrderByIdDesc(Long fieldId);
    List<FieldMasterHistory> findByFieldIdOrderByCreatedAtDesc(Long fieldId);
}
