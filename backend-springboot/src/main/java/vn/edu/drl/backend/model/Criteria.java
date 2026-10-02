package vn.edu.drl.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;

@Data
@Entity
@Table(name = "criteria")
public class Criteria {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "semester_id")
    private Semester semester;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "field_id")
    private FieldMaster fieldMaster;

    @Column(name = "criteria_code", nullable = false, length = 50)
    private String criteriaCode;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String title;

    @Column(length = 100)
    private String category;

    @Column(name = "max_score", nullable = false)
    private BigDecimal maxScore;

    @Column(name = "requires_proof")
    private Boolean requiresProof = false;

    @Column(name = "order_index")
    private Integer orderIndex = 0;
}
