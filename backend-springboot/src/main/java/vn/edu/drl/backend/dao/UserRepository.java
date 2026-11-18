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
    List<User> findByClassEntityIdOrderByUserCodeAsc(Long classId);
    long countByRoleIn(java.util.Collection<Role> roles);
    long countByRoleInAndStatus(java.util.Collection<Role> roles, Integer status);
    long countByDepartmentIdAndRoleIn(Long departmentId, java.util.Collection<Role> roles);
    long countByClassEntityIdAndRoleIn(Long classId, java.util.Collection<Role> roles);
    List<User> findByRole(Role role);
    List<User> findByRoleIn(java.util.Collection<Role> roles);

    @org.springframework.data.jpa.repository.Query("SELECT u.department.id, COUNT(u) FROM User u WHERE u.role IN :roles AND u.department.id IS NOT NULL GROUP BY u.department.id")
    List<Object[]> countStudentsByDepartmentGrouped(@org.springframework.data.repository.query.Param("roles") java.util.Collection<Role> roles);

    @org.springframework.data.jpa.repository.Query("SELECT u.classEntity.id, COUNT(u) FROM User u WHERE u.role IN :roles AND u.classEntity.id IS NOT NULL GROUP BY u.classEntity.id")
    List<Object[]> countStudentsByClassGrouped(@org.springframework.data.repository.query.Param("roles") java.util.Collection<Role> roles);
}
