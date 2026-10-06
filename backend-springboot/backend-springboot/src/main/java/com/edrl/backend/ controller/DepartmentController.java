// backend-springboot/src/main/java/com/edrl/backend/controller/DepartmentController.java
package com.edrl.backend.controller;

import com.edrl.backend.Wrapper.ApiResponse;
import com.edrl.backend.Wrapper.PageWrapper;
import com.edrl.backend.dto.request.DepartmentReq;
import com.edrl.backend.dto.response.DepartmentRes;
import com.edrl.backend.service.DepartmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/departments")
@RequiredArgsConstructor
public class DepartmentController {

    private final DepartmentService departmentService;

    // ========================================================================
    // API PUBLIC CHO MỌI ROLE ĐÃ ĐĂNG NHẬP (Phục vụ Dropdown chọn Khoa ở Frontend)
    // ========================================================================

    /**
     * Lấy danh sách Khoa có phân trang (0-based)
     */
    @GetMapping
    @PreAuthorize("isAuthenticated()") 
    public ApiResponse<PageWrapper<DepartmentRes>> getPagedDepartments(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        Page<DepartmentRes> deptPage = departmentService.getPagedDepartments(page, size);
        return ApiResponse.ok(PageWrapper.of(deptPage));
    }

    /**
     * Lấy toàn bộ danh sách Khoa không phân trang 
     * (Thường dùng cho Select Box lọc dữ liệu trên UI)
     */
    @GetMapping("/all")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<List<DepartmentRes>> getAllDepartments() {
        return ApiResponse.ok(departmentService.getAllDepartments());
    }

    // ========================================================================
    // API QUẢN TRỊ KHOA (CHỈ DÀNH CHO ADMIN)
    // ========================================================================

    @PostMapping
    @PreAuthorize("hasAuthority('ADMIN')")
    public ApiResponse<DepartmentRes> createDepartment(@Valid @RequestBody DepartmentReq request) {
        return ApiResponse.ok(departmentService.createDepartment(request), "Tạo mới Khoa thành công");
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ApiResponse<DepartmentRes> updateDepartment(
            @PathVariable Long id, 
            @Valid @RequestBody DepartmentReq request) {
        return ApiResponse.ok(departmentService.updateDepartment(id, request), "Cập nhật thông tin Khoa thành công");
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ApiResponse<Void> deleteDepartment(@PathVariable Long id) {
        departmentService.deleteDepartment(id);
        return ApiResponse.ok(null, "Đã xóa Khoa khỏi hệ thống");
    }
}