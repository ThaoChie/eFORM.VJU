// backend-springboot/src/main/java/com/edrl/backend/model/ClassEntity.java
package com.edrl.backend.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(name = "classes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClassEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "class_code", unique = true, nullable = false, length = 50)
    private String classCode;

    @Column(name = "class_name", nullable = false, length = 255)
    private String className;

    // Lưu ID của Khoa quản lý lớp này
    @Column(name = "dept_id")
    private Long deptId;

    // Khóa học (VD: K65, K66)
    @Column(name = "academic_cohort", length = 50)
    private String academicCohort;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;
}