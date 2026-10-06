// backend-springboot/src/main/java/com/edrl/backend/controller/UserController.java
package com.edrl.backend.controller;

import com.edrl.backend.Wrapper.ApiResponse;
import com.edrl.backend.Wrapper.PageWrapper;
import com.edrl.backend.dto.request.SignerConfigUpdateReq;
import com.edrl.backend.dto.request.UserCreateReq;
import com.edrl.backend.dto.request.UserUpdateReq;
import com.edrl.backend.dto.response.UserRes;
import com.edrl.backend.enu.Role;
import com.edrl.backend.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/directory/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    // ========================================================================
    // 1. CRUD ĐƠN LẺ (SINGLE RECORD OPERATIONS)
    // ========================================================================

    /**
     * Lấy danh sách người dùng có phân trang và lọc động.
     * Quy tắc 11.2: page mặc định là 0 (0-based).
     */
    @GetMapping
    @PreAuthorize("hasAuthority('ADMIN')")
    public ApiResponse<PageWrapper<UserRes>> getListUsers(
            @RequestParam(required = false) Long deptId,
            @RequestParam(required = false) Long classId,
            @RequestParam(required = false) Role role,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        Page<UserRes> usersPage = userService.getUsers(deptId, classId, role, page, size);
        return ApiResponse.ok(PageWrapper.of(usersPage));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ADMIN')")
    public ApiResponse<UserRes> createSingleUser(@Valid @RequestBody UserCreateReq req) {
        return ApiResponse.ok(userService.createUser(req), "Tạo người dùng thành công");
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ApiResponse<UserRes> updateUser(
            @PathVariable Long id, 
            @Valid @RequestBody UserUpdateReq req) {
        return ApiResponse.ok(userService.updateUser(id, req), "Cập nhật thông tin thành công");
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ApiResponse<Void> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ApiResponse.ok(null, "Đã xóa người dùng");
    }

    // ========================================================================
    // 2. CẤU HÌNH THẨM QUYỀN KÝ SỐ (MODULE 2)
    // ========================================================================

    @PatchMapping("/{id}/signer-config")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ApiResponse<UserRes> updateSignerConfig(
            @PathVariable Long id, 
            @Valid @RequestBody SignerConfigUpdateReq req) {
        return ApiResponse.ok(userService.updateSignerConfig(id, req), "Đã cấu hình thẩm quyền ký số");
    }

    // ========================================================================
    // 3. IMPORT / EXPORT THEO LÔ BẰNG EXCEL (APACHE POI)
    // ========================================================================

    @GetMapping("/template-excel")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<Resource> downloadTemplate() {
        Resource file = userService.generateExcelTemplate();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"template_import_users.xlsx\"")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(file);
    }

    @PostMapping(value = "/import/preview", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAuthority('ADMIN')")
    public ApiResponse<Map<String, Object>> previewImportExcel(@RequestParam("file") MultipartFile file) {
        Map<String, Object> previewData = userService.previewExcelData(file);
        return ApiResponse.ok(previewData, "Đọc file Excel thành công");
    }

    @PostMapping("/import/commit")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ApiResponse<Map<String, Integer>> commitImportExcel(@RequestBody List<UserCreateReq> validUsers) {
        Map<String, Integer> result = userService.bulkCreateUsers(validUsers);
        return ApiResponse.ok(result, "Đã nạp danh sách người dùng thành công");
    }

    @GetMapping("/export")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'DEAN')")
    public ResponseEntity<Resource> exportUsers(
            @RequestParam(required = false) Long deptId,
            @RequestParam(required = false) Long classId) {
        
        Resource file = userService.exportUsersToExcel(deptId, classId);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"danh_sach_nguoi_dung.xlsx\"")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(file);
    }
}