// backend-springboot/src/main/java/com/edrl/backend/model/User.java
package com.edrl.backend.model;

import com.edrl.backend.enu.Role;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_code", unique = true, nullable = false, length = 50)
    private String userCode;

    @Column(name = "full_name", nullable = false, length = 150)
    private String fullName;

    @Column(unique = true, nullable = false, length = 150)
    private String email;

    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private Role role;

    @Column(name = "position_title", length = 100)
    private String positionTitle;

    @Column(name = "dept_id")
    private Long deptId;

    @Column(name = "class_id")
    private Long classId;

    @Column(name = "academic_cohort", length = 50)
    private String academicCohort;

    @Column(name = "is_signer")
    private Boolean isSigner;

    @Column(name = "signature_specimen_url", length = 500)
    private String signatureSpecimenUrl;

    @Column(name = "is_active")
    private Boolean isActive;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;
}