package vn.edu.drl.backend.dao;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.edu.drl.backend.model.User;
import vn.edu.drl.backend.enu.Role;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    long countByDepartmentId(Long departmentId);
    Optional<User> findFirstByDepartmentIdAndRole(Long departmentId, Role role);
    Optional<User> findByEmail(String email);
    Optional<User> findByUserCode(String userCode);
    List<User> findByClassEntityIdAndRole(Long classId, Role role);
    List<User> findByDepartmentIdAndRole(Long departmentId, Role role);
    long countByClassEntityId(Long classId);
    List<User> findByClassEntityId(Long classId);
}
