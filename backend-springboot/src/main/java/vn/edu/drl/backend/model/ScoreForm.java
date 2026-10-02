package vn.edu.drl.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import vn.edu.drl.backend.enu.ScoreFormStatus;
import java.math.BigDecimal;
import java.time.Instant;

@Data
@Entity
@Table(name = "score_forms")
public class ScoreForm {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id")
    private User student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "semester_id")
    private Semester semester;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "form_version_id")
    private FormVersion formVersion;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private ScoreFormStatus status;

    @Column(name = "student_total")
    private BigDecimal studentTotal;

    @Column(name = "class_total")
    private BigDecimal classTotal;

    @Column(name = "final_total")
    private BigDecimal finalTotal;

    @Column(length = 50)
    private String ranking;

    @Column(name = "reject_reason", columnDefinition = "TEXT")
    private String rejectReason;

    @Column(name = "pdf_file_url", columnDefinition = "TEXT")
    private String pdfFileUrl;

    @Column(name = "pdf_hash_sha256")
    private String pdfHashSha256;

    @Column(name = "is_locked")
    private Boolean isLocked = false;

    @Version
    private Long version;

    @Column(name = "created_at", insertable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private Instant updatedAt;
}
