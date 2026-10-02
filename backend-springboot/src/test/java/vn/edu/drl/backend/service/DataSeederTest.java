package vn.edu.drl.backend.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import vn.edu.drl.backend.dao.ClassRepository;
import vn.edu.drl.backend.dao.DepartmentRepository;
import vn.edu.drl.backend.dao.SemesterRepository;
import vn.edu.drl.backend.dao.UserRepository;
import vn.edu.drl.backend.model.ClassEntity;
import vn.edu.drl.backend.model.Department;
import vn.edu.drl.backend.model.Semester;
import vn.edu.drl.backend.model.User;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DataSeederTest {

    @Mock
    private DepartmentRepository departmentRepository;
    @Mock
    private ClassRepository classRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private SemesterRepository semesterRepository;
    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private DataSeeder dataSeeder;

    @Test
    void run_WhenDBEmpty_ShouldSeedData() throws Exception {
        when(departmentRepository.count()).thenReturn(0L);
        when(departmentRepository.save(any(Department.class))).thenReturn(new Department());
        when(classRepository.save(any(ClassEntity.class))).thenReturn(new ClassEntity());
        when(passwordEncoder.encode("password123")).thenReturn("hashed");

        dataSeeder.run();

        verify(departmentRepository, times(1)).save(any(Department.class));
        verify(classRepository, times(1)).save(any(ClassEntity.class));
        verify(semesterRepository, times(1)).save(any(Semester.class));
        verify(userRepository, times(4)).save(any(User.class)); // 4 role
    }

    @Test
    void run_WhenDBNotEmpty_ShouldNotSeedData() throws Exception {
        when(departmentRepository.count()).thenReturn(1L);

        dataSeeder.run();

        verify(departmentRepository, times(0)).save(any(Department.class));
        verify(userRepository, times(0)).save(any(User.class));
    }
}
