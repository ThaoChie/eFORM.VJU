package vn.edu.drl.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

@Data
@Entity
@Table(name = "semesters")
public class Semester {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "semester_code", unique = true, nullable = false, length = 50)
    private String semesterCode;

    @Column(name = "semester_name", nullable = false)
    private String semesterName;

    @Column(name = "academic_year", nullable = false, length = 50)
    private String academicYear;

    @Column(name = "is_active")
    private Boolean isActive = false;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;
}
