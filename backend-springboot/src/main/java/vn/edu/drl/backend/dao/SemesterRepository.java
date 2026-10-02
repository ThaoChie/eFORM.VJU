package vn.edu.drl.backend.dao;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.edu.drl.backend.model.Semester;
public interface SemesterRepository extends JpaRepository<Semester, Long> {}
