package vn.edu.drl.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;

@Data
@Entity
@Table(name = "score_form_details")
public class ScoreFormDetail {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "score_form_id")
    private ScoreForm scoreForm;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "criteria_id")
    private Criteria criteria;

    @Column(name = "student_score")
    private BigDecimal studentScore;

    @Column(name = "class_score")
    private BigDecimal classScore;

    @Column(name = "proof_url", columnDefinition = "TEXT")
    private String proofUrl;

    @Column(columnDefinition = "TEXT")
    private String note;
}
