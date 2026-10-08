package vn.edu.drl.backend.service;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import vn.edu.drl.backend.dao.*;
import vn.edu.drl.backend.enu.Role;
import vn.edu.drl.backend.model.*;

import java.time.LocalDate;

@Component
@Profile("!prod")
public class DataSeeder implements CommandLineRunner {

    private final DepartmentRepository departmentRepository;
    private final ClassRepository classRepository;
    private final UserRepository userRepository;
    private final SemesterRepository semesterRepository;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(DepartmentRepository departmentRepository,
                      ClassRepository classRepository,
                      UserRepository userRepository,
                      SemesterRepository semesterRepository,
                      PasswordEncoder passwordEncoder) {
        this.departmentRepository = departmentRepository;
        this.classRepository = classRepository;
        this.userRepository = userRepository;
        this.semesterRepository = semesterRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
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
            student.setFullName("Sinh Viên Demo");
            student.setPasswordHash(defaultPassword);
            student.setRole(Role.STUDENT);
            student.setDepartment(dept);
            student.setClassEntity(cls);
            userRepository.save(student);
        }
    }
}
