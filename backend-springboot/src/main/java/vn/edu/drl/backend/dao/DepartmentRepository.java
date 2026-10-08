package vn.edu.drl.backend.dao;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.edu.drl.backend.model.Department;
public interface DepartmentRepository extends JpaRepository<Department, Long> {
    java.util.Optional<Department> findByDeptCode(String code);
    boolean existsByDeptCode(String deptCode);
}
