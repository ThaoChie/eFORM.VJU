package vn.edu.drl.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.Instant;

@Data
@Entity
@Table(name = "departments")
@com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Department {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "dept_code", unique = true, nullable = false, length = 50)
    private String deptCode;

    @Column(name = "dept_name", nullable = false)
    private String deptName;

    @Column(name = "created_at", insertable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "status")
    private Integer status = 1;
}
