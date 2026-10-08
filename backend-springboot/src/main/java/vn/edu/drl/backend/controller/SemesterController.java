package vn.edu.drl.backend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import vn.edu.drl.backend.Wrapper.ApiResponse;
import vn.edu.drl.backend.dto.request.SemesterRequest;
import vn.edu.drl.backend.dto.response.SemesterResponse;
import vn.edu.drl.backend.service.SemesterService;

import java.util.List;

@RestController
@RequestMapping("/api/v1/semesters")
@RequiredArgsConstructor
public class SemesterController {
    private final SemesterService semesterService;

    @GetMapping
    public ApiResponse<List<SemesterResponse>> getAllSemesters() {
        return ApiResponse.success(semesterService.getAllSemesters());
    }

    @GetMapping("/{id}")
    public ApiResponse<SemesterResponse> getSemesterById(@PathVariable Long id) {
        return ApiResponse.success(semesterService.getSemesterById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<SemesterResponse> createSemester(@Valid @RequestBody SemesterRequest request) {
        return ApiResponse.success(semesterService.createSemester(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<SemesterResponse> updateSemester(@PathVariable Long id, @Valid @RequestBody SemesterRequest request) {
        return ApiResponse.success(semesterService.updateSemester(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Void> deleteSemester(@PathVariable Long id) {
        semesterService.deleteSemester(id);
        return ApiResponse.success(null);
    }
}
