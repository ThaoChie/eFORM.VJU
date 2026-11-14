package vn.edu.drl.backend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import vn.edu.drl.backend.Wrapper.ApiResponse;
import vn.edu.drl.backend.dto.request.MajorRequest;
import vn.edu.drl.backend.service.interfaces.MajorService;

@RestController
@RequestMapping("/api/v1/majors")
@RequiredArgsConstructor
public class MajorController {

    private final MajorService majorService;

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

    @GetMapping("/template-excel")
    public ResponseEntity<byte[]> downloadTemplate() {
        byte[] data = majorService.generateExcelTemplate();
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=majors_template.xlsx")
                .body(data);
    }

    @PostMapping("/import")
    public ApiResponse<?> importExcel(@RequestParam("file") MultipartFile file,
                                      @RequestParam(defaultValue = "true") boolean preview) {
        return ApiResponse.success(majorService.importFromExcel(file, preview));
    }

    @PutMapping("/{id}/toggle-status")
    public ApiResponse<?> toggleStatus(@PathVariable Long id) {
        return ApiResponse.success(majorService.toggleStatus(id));
    }
}
