package vn.edu.drl.backend.dao;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.edu.drl.backend.model.ClassEntity;
public interface ClassRepository extends JpaRepository<ClassEntity, Long> {}
