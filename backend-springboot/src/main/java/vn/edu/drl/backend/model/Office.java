package vn.edu.drl.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.Instant;

@Data
@Entity
@Table(name = "offices")
@com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Office {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "office_code", unique = true, nullable = false, length = 50)
    private String officeCode;

    @Column(name = "office_name", nullable = false)
    private String officeName;

    @Column(name = "status")
    private Integer status = 1;

    @Column(name = "created_at", insertable = false, updatable = false)
    private Instant createdAt;
}
