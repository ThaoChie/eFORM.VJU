package vn.edu.drl.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import vn.edu.drl.backend.enu.FieldDataType;
import java.math.BigDecimal;
import java.time.Instant;

@Data
@Entity
@Table(name = "field_master_history")
public class FieldMasterHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "field_id", nullable = false)
    private Long fieldId;

    @Column(nullable = false, length = 20)
    private String version;

    @Column(name = "field_code", nullable = false, length = 100)
    private String fieldCode;

    @Column(name = "field_name", nullable = false)
    private String fieldName;

    @Enumerated(EnumType.STRING)
    @Column(name = "data_type", nullable = false, length = 50)
    private FieldDataType dataType;

    @Column(length = 100)
    private String category;

    @Column(name = "is_required")
    private Boolean isRequired = false;

    @Column(name = "min_value")
    private BigDecimal minValue;

    @Column(name = "max_value")
    private BigDecimal maxValue;

    @Column(name = "regex_pattern")
    private String regexPattern;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(name = "created_at")
    private Instant createdAt;
}
