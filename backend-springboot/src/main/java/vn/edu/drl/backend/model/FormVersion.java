package vn.edu.drl.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import vn.edu.drl.backend.enu.FormVersionStatus;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.Instant;

@Data
@Entity
@Table(name = "form_versions")
public class FormVersion {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "form_code", nullable = false, length = 50)
    private String formCode;

    @Column(name = "form_name", nullable = false)
    private String formName;

    @Column(name = "version_no", nullable = false, length = 20)
    private String versionNo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "semester_id")
    private Semester semester;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "template_layout_json", columnDefinition = "jsonb")
    private String templateLayoutJson;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private FormVersionStatus status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @Column(name = "created_at", insertable = false, updatable = false)
    private Instant createdAt;
}
