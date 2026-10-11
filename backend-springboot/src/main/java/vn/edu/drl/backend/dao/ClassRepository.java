package vn.edu.drl.backend.dao;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.edu.drl.backend.model.ClassEntity;

import java.util.List;
import java.util.Optional;

public interface ClassRepository extends JpaRepository<ClassEntity, Long> {
    long countByDepartmentId(Long departmentId);
    Optional<ClassEntity> findByClassCode(String code);

    @Override
    @EntityGraph(attributePaths = {"department"})
    List<ClassEntity> findAll();
}
