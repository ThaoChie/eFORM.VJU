package com.edrl.backend.service;

import com.edrl.backend.dao.UserRepository;
import com.edrl.backend.dto.request.SignerConfigUpdateReq;
import com.edrl.backend.dto.request.UserCreateReq;
import com.edrl.backend.dto.request.UserUpdateReq;
import com.edrl.backend.dto.response.UserRes;
import com.edrl.backend.enu.Role;
import com.edrl.backend.exception.AppException;
import com.edrl.backend.model.User;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
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

    @Transactional(readOnly = true)
    public Page<UserRes> getUsers(Long deptId, Long classId, Role role, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<User> usersPage = userRepository.findAll(pageable);
        
        List<UserRes> userResList = usersPage.getContent().stream()
                .map(this::mapToUserRes)
                .collect(Collectors.toList());
                
        return new PageImpl<>(userResList, pageable, usersPage.getTotalElements());
    }

    @Transactional
    public UserRes createUser(UserCreateReq req) {
        if (userRepository.existsByUserCodeOrEmail(req.getUserCode(), req.getEmail())) {
            throw new AppException(HttpStatus.CONFLICT, "DUPLICATE", "Mã định danh hoặc email đã tồn tại");
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
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Không tìm thấy người dùng"));

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
            throw new AppException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Không tìm thấy người dùng");
        }
        userRepository.deleteById(id);
    }

    @Transactional
    public UserRes updateSignerConfig(Long id, SignerConfigUpdateReq req) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Không tìm thấy người dùng"));

        user.setIsSigner(req.getIsSigner());
        if (req.getSignatureSpecimenUrl() != null) {
            user.setSignatureSpecimenUrl(req.getSignatureSpecimenUrl());
        }

        return mapToUserRes(userRepository.save(user));
    }

    // ========================================================================
    // TỐI ƯU IMPORT BẰNG BATCH INSERT
    // ========================================================================
    @Transactional
    public Map<String, Integer> bulkCreateUsers(List<UserCreateReq> validUsers) {
        List<User> usersToSave = new ArrayList<>();
        int errorCount = 0;

        for (UserCreateReq req : validUsers) {
            // Check xem trùng thì bỏ qua, không throw lỗi để không bị rollback toàn bộ
            if (userRepository.existsByUserCodeOrEmail(req.getUserCode(), req.getEmail())) {
                errorCount++;
                continue;
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
            
            usersToSave.add(user);
        }

        // Thực hiện Insert 1 lần duy nhất cho toàn bộ mảng hợp lệ
        if (!usersToSave.isEmpty()) {
            userRepository.saveAll(usersToSave);
        }

        Map<String, Integer> result = new HashMap<>();
        result.put("success", usersToSave.size());
        result.put("failed", errorCount);
        return result;
    }

    public Resource generateExcelTemplate() {
        return new ByteArrayResource(new byte[0]);
    }

    public Map<String, Object> previewExcelData(MultipartFile file) {
        Map<String, Object> response = new HashMap<>();
        response.put("totalRows", 0);
        response.put("validRows", 0);
        response.put("errorRows", 0);
        response.put("validData", new ArrayList<>());
        response.put("errorDetails", new ArrayList<>());
        return response;
    }

    public Resource exportUsersToExcel(Long deptId, Long classId) {
        return new ByteArrayResource(new byte[0]);
    }

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