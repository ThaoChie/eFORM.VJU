package vn.edu.drl.backend.dao;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.edu.drl.backend.model.ClassEntity;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ClassRepository extends JpaRepository<ClassEntity, Long> {
    @Query("SELECT COUNT(c) FROM ClassEntity c WHERE c.department.id = :departmentId")
    long countByDepartmentId(@Param("departmentId") Long departmentId);
    Optional<ClassEntity> findByClassCode(String code);

    @Override
    @EntityGraph(attributePaths = {"department"})
    List<ClassEntity> findAll();
}
