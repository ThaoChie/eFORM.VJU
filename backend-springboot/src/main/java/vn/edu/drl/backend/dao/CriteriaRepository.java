package vn.edu.drl.backend.dao;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.edu.drl.backend.model.Criteria;
public interface CriteriaRepository extends JpaRepository<Criteria, Long> {
    boolean existsByFieldMasterId(Long fieldId);
}
