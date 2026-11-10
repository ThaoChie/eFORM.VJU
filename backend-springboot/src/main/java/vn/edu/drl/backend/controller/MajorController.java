package vn.edu.drl.backend.controller;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import vn.edu.drl.backend.Wrapper.ApiResponse;
import vn.edu.drl.backend.dto.request.MajorRequest;
import vn.edu.drl.backend.service.MajorService;

@RestController
@RequestMapping("/api/v1/majors")
public class MajorController {

    private final MajorService majorService;

    public MajorController(MajorService majorService) {
        this.majorService = majorService;
    }

    @GetMapping
    public ApiResponse<?> getAll() {
        return ApiResponse.success(majorService.findAll());
    }

    @GetMapping("/{id}")
    public ApiResponse<?> getById(@PathVariable Long id) {
        return ApiResponse.success(majorService.findById(id));
    }

    @PostMapping
    public ApiResponse<?> create(@Valid @RequestBody MajorRequest req) {
        return ApiResponse.success(majorService.create(req));
    }

    @PutMapping("/{id}")
    public ApiResponse<?> update(@PathVariable Long id, @RequestBody MajorRequest req) {
        return ApiResponse.success(majorService.update(id, req));
    }

    @PutMapping("/{id}/toggle-status")
    public ApiResponse<?> toggleStatus(@PathVariable Long id) {
        return ApiResponse.success(majorService.toggleStatus(id));
    }
}
