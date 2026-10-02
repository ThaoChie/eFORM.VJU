package vn.edu.drl.backend.dao;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.edu.drl.backend.model.User;
public interface UserRepository extends JpaRepository<User, Long> {
    boolean existsByEmail(String email);
}
