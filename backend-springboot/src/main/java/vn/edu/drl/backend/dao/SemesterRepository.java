package vn.edu.drl.backend.dao;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.edu.drl.backend.model.Semester;
import java.util.Optional;

public interface SemesterRepository extends JpaRepository<Semester, Long> {
    Optional<Semester> findByIsActiveTrue();
    boolean existsBySemesterCode(String semesterCode);
}
