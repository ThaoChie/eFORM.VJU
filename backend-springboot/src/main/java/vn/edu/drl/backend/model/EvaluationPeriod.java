package vn.edu.drl.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import vn.edu.drl.backend.enu.EvaluationPeriodStatus;

import java.time.Instant;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "evaluation_periods")
public class EvaluationPeriod {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "period_code", length = 100, unique = true)
    private String periodCode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "semester_id", nullable = false)
    private Semester semester;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "form_version_id", nullable = false)
    private FormVersion formVersion;

    @Column(name = "application_scope", nullable = false, length = 100)
    private String applicationScope;

    @Column(name = "applicable_departments", columnDefinition = "TEXT")
    private String applicableDepartments;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "student_deadline")
    private LocalDate studentDeadline;

    @Column(name = "class_deadline")
    private LocalDate classDeadline;

    @Column(name = "dean_deadline")
    private LocalDate deanDeadline;

    /**
     * Giữ lại để tương thích ngược với các module hiện có (bằng studentDeadline)
     */
    @Column(name = "submission_deadline", nullable = false)
    private LocalDate submissionDeadline;

    @Column(name = "exceptions", columnDefinition = "TEXT")
    private String exceptions;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    @Builder.Default
    private EvaluationPeriodStatus status = EvaluationPeriodStatus.CHUA_MO;

    @Column(name = "is_locked")
    @Builder.Default
    private Boolean isLocked = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @Column(name = "created_at", insertable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @PrePersist
    @PreUpdate
    public void onUpdate() {
        this.updatedAt = Instant.now();
        if (this.studentDeadline != null && this.submissionDeadline == null) {
            this.submissionDeadline = this.studentDeadline;
        } else if (this.submissionDeadline != null && this.studentDeadline == null) {
            this.studentDeadline = this.submissionDeadline;
        }
    }
}
