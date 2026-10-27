package vn.edu.drl.backend.service;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import vn.edu.drl.backend.dao.*;
import vn.edu.drl.backend.enu.Role;
import vn.edu.drl.backend.enu.ScoreFormStatus;
import vn.edu.drl.backend.model.*;

import java.time.LocalDate;

@Component
@Profile("!prod")
public class DataSeeder implements CommandLineRunner {

    private final DepartmentRepository departmentRepository;
    private final ClassRepository classRepository;
    private final UserRepository userRepository;
    private final SemesterRepository semesterRepository;
    private final vn.edu.drl.backend.dao.SignatureLogRepository signatureLogRepository;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(DepartmentRepository departmentRepository,
                      ClassRepository classRepository,
                      UserRepository userRepository,
                      SemesterRepository semesterRepository,
                      vn.edu.drl.backend.dao.SignatureLogRepository signatureLogRepository,
                      PasswordEncoder passwordEncoder) {
        this.departmentRepository = departmentRepository;
        this.classRepository = classRepository;
        this.userRepository = userRepository;
        this.semesterRepository = semesterRepository;
        this.signatureLogRepository = signatureLogRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @org.springframework.transaction.annotation.Transactional
    public void run(String... args) throws Exception {
        if (departmentRepository.count() == 0) {
            Department dept = new Department();
            dept.setDeptCode("CNTT");
            dept.setDeptName("Khoa Công nghệ Thông tin");
            dept = departmentRepository.save(dept);

            ClassEntity cls = new ClassEntity();
            cls.setClassCode("IT01");
            cls.setClassName("Lớp IT Khóa 1");
            cls.setDepartment(dept);
            cls.setAcademicCohort("2023");
            cls = classRepository.save(cls);

            Semester sem = new Semester();
            sem.setSemesterCode("HK1_2026");
            sem.setSemesterName("Học kỳ 1 Năm 2026-2027");
            sem.setAcademicYear("2026-2027");
            sem.setIsActive(true);
            sem.setStartDate(LocalDate.of(2026, 9, 1));
            sem.setEndDate(LocalDate.of(2027, 1, 15));
            semesterRepository.save(sem);

            String defaultPassword = passwordEncoder.encode("123456");

            User admin = new User();
            admin.setEmail("admin@drl.edu.vn");
            admin.setFullName("Quản trị viên");
            admin.setPasswordHash(defaultPassword);
            admin.setRole(Role.ADMIN);
            userRepository.save(admin);

            User dean = new User();
            dean.setEmail("dean@drl.edu.vn");
            dean.setFullName("Trưởng Khoa CNTT");
            dean.setPasswordHash(defaultPassword);
            dean.setRole(Role.DEAN);
            dean.setDepartment(dept);
            userRepository.save(dean);

            User classLeader = new User();
            classLeader.setEmail("leader@drl.edu.vn");
            classLeader.setFullName("Lớp Trưởng IT01");
            classLeader.setPasswordHash(defaultPassword);
            classLeader.setRole(Role.CLASS_LEADER);
            classLeader.setDepartment(dept);
            classLeader.setClassEntity(cls);
            userRepository.save(classLeader);

            User student = new User();
            student.setEmail("student@drl.edu.vn");
            student.setFullName("Nguyễn Văn A");
            student.setUserCode("SV2026001");
            student.setPasswordHash(defaultPassword);
            student.setRole(Role.STUDENT);
            student.setDepartment(dept);
            student.setClassEntity(cls);
            student.setSignatureSpecimenUrl(null);
            student.setIsSignatureLocked(false);
            userRepository.save(student);
        }

        // Auto-heal: Ensure all leaders and students have a valid class assigned
        ClassEntity defaultClass = classRepository.findAll().stream().findFirst().orElse(null);
        Department defaultDept = departmentRepository.findAll().stream().findFirst().orElse(null);

        if (defaultClass != null) {
            java.util.List<User> usersToUpdate = userRepository.findAll();
            for (User u : usersToUpdate) {
                boolean changed = false;
                if (u.getClassEntity() == null && (u.getRole() == Role.STUDENT || u.getRole() == Role.CLASS_LEADER || u.getRole() == Role.CLASS_DEPUTY)) {
                    u.setClassEntity(defaultClass);
                    changed = true;
                }
                if (u.getDepartment() == null && defaultDept != null && (u.getRole() == Role.STUDENT || u.getRole() == Role.CLASS_LEADER || u.getRole() == Role.CLASS_DEPUTY || u.getRole() == Role.DEAN)) {
                    u.setDepartment(defaultDept);
                    changed = true;
                }
                if (changed) {
                    userRepository.save(u);
                }
            }
        }

        // Auto-heal: Ensure every role (Student, Class Leader, Dean) has their own distinct, encrypted signature
        try {
            // Find student signature specimen if present
            String studentSig = null;
            for (User u : userRepository.findAll()) {
                if (u.getRole() == Role.STUDENT && u.getSignatureSpecimenUrl() != null && !u.getSignatureSpecimenUrl().trim().isEmpty()) {
                    studentSig = u.getSignatureSpecimenUrl();
                    break;
                }
            }

            for (User u : userRepository.findAll()) {
                boolean changed = false;
                if (vn.edu.drl.backend.service.engine.ImageConversionUtils.isHeic(u.getSignatureSpecimenUrl())) {
                    String converted = vn.edu.drl.backend.service.engine.ImageConversionUtils.ensureStandardWebImage(u.getSignatureSpecimenUrl());
                    u.setSignatureSpecimenUrl(converted);
                    changed = true;
                }

                // Ensure Class Leader and Dean have their own unique role signatures (only if not yet uploaded by user)
                if (u.getRole() == Role.CLASS_LEADER || u.getRole() == Role.CLASS_DEPUTY) {
                    if (u.getSignatureSpecimenUrl() == null || u.getSignatureSpecimenUrl().trim().isEmpty() ||
                        u.getSignatureSpecimenUrl().startsWith("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAUAAAABkCAYAAAC3Yg8w")) {
                        String name = u.getFullName() != null ? u.getFullName() : "Lớp Trưởng IT01";
                        String ownSig = vn.edu.drl.backend.service.engine.ImageConversionUtils.generateSpecimenPngBase64(name, "Cán bộ lớp", new java.awt.Color(6, 95, 70));
                        u.setSignatureSpecimenUrl(ownSig);
                        u.setIsSignatureLocked(true);
                        u.setSignatureRegisteredAt(java.time.Instant.now());
                        changed = true;
                        System.out.println("Assigned default Class Leader signature for User " + u.getId() + " (" + name + ")");
                    }
                } else if (u.getRole() == Role.DEAN) {
                    if (u.getSignatureSpecimenUrl() == null || u.getSignatureSpecimenUrl().trim().isEmpty() ||
                        u.getSignatureSpecimenUrl().startsWith("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAUAAAABkCAYAAAC3Yg8w")) {
                        String name = u.getFullName() != null ? u.getFullName() : "Trưởng Khoa CNTT";
                        String ownSig = vn.edu.drl.backend.service.engine.ImageConversionUtils.generateSpecimenPngBase64(name, "Trưởng Khoa", new java.awt.Color(136, 19, 55));
                        u.setSignatureSpecimenUrl(ownSig);
                        u.setIsSignatureLocked(true);
                        u.setSignatureRegisteredAt(java.time.Instant.now());
                        changed = true;
                        System.out.println("Assigned default Dean signature for User " + u.getId() + " (" + name + ")");
                    }
                }

                if (changed) {
                    userRepository.save(u);
                }
            }

            // Convert any HEIC signatures in users
            for (User u : userRepository.findAll()) {
                if (u.getSignatureSpecimenUrl() != null && vn.edu.drl.backend.service.engine.ImageConversionUtils.isHeic(u.getSignatureSpecimenUrl())) {
                    String cleanPng = vn.edu.drl.backend.service.engine.ImageConversionUtils.ensureStandardWebImage(u.getSignatureSpecimenUrl());
                    u.setSignatureSpecimenUrl(cleanPng);
                    userRepository.save(u);
                }
            }

            // Repair SignatureLogs: convert HEIC, delete premature logs for SUBMITTED forms, and clean black box signatures
            for (vn.edu.drl.backend.model.SignatureLog sl : signatureLogRepository.findAll()) {
                if (sl.getSignatureImgUrl() != null && vn.edu.drl.backend.service.engine.ImageConversionUtils.isHeic(sl.getSignatureImgUrl())) {
                    String cleanPng = vn.edu.drl.backend.service.engine.ImageConversionUtils.ensureStandardWebImage(sl.getSignatureImgUrl());
                    sl.setSignatureImgUrl(cleanPng);
                    signatureLogRepository.save(sl);
                }
                if (sl.getScoreForm() != null && (sl.getScoreForm().getStatus() == ScoreFormStatus.SUBMITTED || sl.getScoreForm().getStatus() == ScoreFormStatus.DRAFT)) {
                    if (sl.getSignOrder() != null && (sl.getSignOrder() == 2 || sl.getSignOrder() == 3)) {
                        signatureLogRepository.delete(sl);
                        continue;
                    }
                }
                if (sl.getSignatureImgUrl() != null && sl.getSignatureImgUrl().startsWith("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAUAAAABkCAYAAAC3Yg8w")) {
                    Long signerId = sl.getSigner() != null ? sl.getSigner().getId() : null;
                    User signer = signerId != null ? userRepository.findById(signerId).orElse(null) : null;
                    if (sl.getSignOrder() != null && sl.getSignOrder() == 2) {
                        sl.setSignatureImgUrl(vn.edu.drl.backend.service.engine.ImageConversionUtils.generateSpecimenPngBase64(signer != null ? signer.getFullName() : "Lớp Trưởng IT01", "Cán bộ lớp", new java.awt.Color(6, 95, 70)));
                        signatureLogRepository.save(sl);
                    } else if (sl.getSignOrder() != null && sl.getSignOrder() == 3) {
                        sl.setSignatureImgUrl(vn.edu.drl.backend.service.engine.ImageConversionUtils.generateSpecimenPngBase64(signer != null ? signer.getFullName() : "Trưởng Khoa CNTT", "Trưởng Khoa", new java.awt.Color(136, 19, 55)));
                        signatureLogRepository.save(sl);
                    }
                }
            }
        } catch (Exception ex) {
            System.err.println("Signature auto-convert warning: " + ex.getMessage());
        }
    }
}
