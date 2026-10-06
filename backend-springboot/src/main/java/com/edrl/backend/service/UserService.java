package com.edrl.backend.service;

import com.edrl.backend.dao.UserRepository;
import com.edrl.backend.dto.request.SignerConfigUpdateReq;
import com.edrl.backend.dto.request.UserCreateReq;
import com.edrl.backend.dto.request.UserUpdateReq;
import com.edrl.backend.dto.response.UserRes;
import com.edrl.backend.enu.Role;
import com.edrl.backend.model.User;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    // ========================================================================
    // 1. CRUD CƠ BẢN (MODULE 2)
    // ========================================================================

    @Transactional(readOnly = true)
    public Page<UserRes> getUsers(Long deptId, Long classId, Role role, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        
        // Ghi chú: Để lọc động phức tạp, dự án dùng hibernateDao/Criteria API.
        // Tạm thời trả về toàn bộ dữ liệu qua JpaRepository cơ bản.
        Page<User> usersPage = userRepository.findAll(pageable);
        
        List<UserRes> userResList = usersPage.getContent().stream()
                .map(this::mapToUserRes)
                .collect(Collectors.toList());
                
        return new PageImpl<>(userResList, pageable, usersPage.getTotalElements());
    }

    @Transactional
    public UserRes createUser(UserCreateReq req) {
        if (userRepository.existsByUserCodeOrEmail(req.getUserCode(), req.getEmail())) {
            throw new RuntimeException("DUPLICATE: Mã định danh hoặc email đã tồn tại");
        }

        User user = User.builder()
                .userCode(req.getUserCode())
                .fullName(req.getFullName())
                .email(req.getEmail())
                .passwordHash(passwordEncoder.encode(req.getPassword()))
                .role(req.getRole())
                .positionTitle(req.getPositionTitle())
                .deptId(req.getDeptId())
                .classId(req.getClassId())
                .academicCohort(req.getAcademicCohort())
                .isSigner(req.getIsSigner() != null ? req.getIsSigner() : false)
                .isActive(true)
                .build();

        return mapToUserRes(userRepository.save(user));
    }

    @Transactional
    public UserRes updateUser(Long id, UserUpdateReq req) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("NOT_FOUND: Không tìm thấy người dùng"));

        if (req.getFullName() != null) user.setFullName(req.getFullName());
        if (req.getPositionTitle() != null) user.setPositionTitle(req.getPositionTitle());
        if (req.getRole() != null) user.setRole(req.getRole());
        if (req.getDeptId() != null) user.setDeptId(req.getDeptId());
        if (req.getClassId() != null) user.setClassId(req.getClassId());
        if (req.getIsActive() != null) user.setIsActive(req.getIsActive());

        return mapToUserRes(userRepository.save(user));
    }

    @Transactional
    public void deleteUser(Long id) {
        if (!userRepository.existsById(id)) {
            throw new RuntimeException("NOT_FOUND: Không tìm thấy người dùng");
        }
        userRepository.deleteById(id);
    }

    // ========================================================================
    // 2. CẤU HÌNH KÝ SỐ (MODULE 2)
    // ========================================================================

    @Transactional
    public UserRes updateSignerConfig(Long id, SignerConfigUpdateReq req) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("NOT_FOUND: Không tìm thấy người dùng"));

        user.setIsSigner(req.getIsSigner());
        if (req.getSignatureSpecimenUrl() != null) {
            user.setSignatureSpecimenUrl(req.getSignatureSpecimenUrl());
        }

        return mapToUserRes(userRepository.save(user));
    }

    // ========================================================================
    // 3. EXCEL IMPORT / EXPORT (APACHE POI MOCK/SKELETON)
    // ========================================================================

    public Resource generateExcelTemplate() {
        // TODO: Khởi tạo XSSFWorkbook, tạo header row (MaSV, HoTen, Email, Role...)
        // Hiện tại trả về mảng byte rỗng mô phỏng
        return new ByteArrayResource(new byte[0]);
    }

    public Map<String, Object> previewExcelData(MultipartFile file) {
        // TODO: Dùng XSSFWorkbook đọc file, validate định dạng từng dòng
        // Trả về số dòng hợp lệ, số dòng lỗi, danh sách validUsers và errorLogs
        Map<String, Object> response = new HashMap<>();
        response.put("totalRows", 0);
        response.put("validRows", 0);
        response.put("errorRows", 0);
        response.put("validData", new ArrayList<>());
        response.put("errorDetails", new ArrayList<>());
        return response;
    }

    @Transactional
    public Map<String, Integer> bulkCreateUsers(List<UserCreateReq> validUsers) {
        int successCount = 0;
        int errorCount = 0;

        for (UserCreateReq req : validUsers) {
            try {
                createUser(req);
                successCount++;
            } catch (Exception e) {
                errorCount++;
            }
        }

        Map<String, Integer> result = new HashMap<>();
        result.put("success", successCount);
        result.put("failed", errorCount);
        return result;
    }

    public Resource exportUsersToExcel(Long deptId, Long classId) {
        // TODO: Dùng SXSSFWorkbook stream dữ liệu từ database ra file Excel
        return new ByteArrayResource(new byte[0]);
    }

    // ========================================================================
    // 4. TIỆN ÍCH MAPPING
    // ========================================================================

    private UserRes mapToUserRes(User user) {
        return UserRes.builder()
                .id(user.getId())
                .userCode(user.getUserCode())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole())
                .deptId(user.getDeptId())
                .classId(user.getClassId())
                .isSigner(user.getIsSigner())
                .isActive(user.getIsActive())
                .build();
    }
}