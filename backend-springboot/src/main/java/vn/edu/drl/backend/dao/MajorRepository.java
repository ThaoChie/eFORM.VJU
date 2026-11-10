package vn.edu.drl.backend.dao;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.edu.drl.backend.model.Major;
import java.util.List;
import java.util.Optional;

public interface MajorRepository extends JpaRepository<Major, Long> {
    Optional<Major> findByMajorCode(String majorCode);
    List<Major> findByDepartmentId(Long deptId);
    boolean existsByMajorCode(String majorCode);
    long countByDepartmentId(Long deptId);
}
