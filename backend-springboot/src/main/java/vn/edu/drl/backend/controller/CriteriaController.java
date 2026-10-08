package vn.edu.drl.backend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import vn.edu.drl.backend.Wrapper.ApiResponse;
import vn.edu.drl.backend.dto.request.CriteriaRequest;
import vn.edu.drl.backend.dto.response.CriteriaResponse;
import vn.edu.drl.backend.service.CriteriaService;

import java.util.List;

@RestController
@RequestMapping("/api/v1/criteria")
@RequiredArgsConstructor
public class CriteriaController {
    private final CriteriaService criteriaService;

    @GetMapping
    public ApiResponse<List<CriteriaResponse>> getCriteriaBySemester(@RequestParam Long semesterId) {
        return ApiResponse.success(criteriaService.getCriteriaBySemester(semesterId));
    }

    @GetMapping("/{id}")
    public ApiResponse<CriteriaResponse> getCriteriaById(@PathVariable Long id) {
        return ApiResponse.success(criteriaService.getCriteriaById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<CriteriaResponse> createCriteria(@Valid @RequestBody CriteriaRequest request) {
        return ApiResponse.success(criteriaService.createCriteria(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<CriteriaResponse> updateCriteria(@PathVariable Long id, @Valid @RequestBody CriteriaRequest request) {
        return ApiResponse.success(criteriaService.updateCriteria(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Void> deleteCriteria(@PathVariable Long id) {
        criteriaService.deleteCriteria(id);
        return ApiResponse.success(null);
    }
}
