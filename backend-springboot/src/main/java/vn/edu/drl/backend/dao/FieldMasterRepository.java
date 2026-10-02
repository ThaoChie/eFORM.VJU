package vn.edu.drl.backend.dao;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.edu.drl.backend.model.FieldMaster;
public interface FieldMasterRepository extends JpaRepository<FieldMaster, Long> {
    boolean existsByFieldCode(String fieldCode);
}
