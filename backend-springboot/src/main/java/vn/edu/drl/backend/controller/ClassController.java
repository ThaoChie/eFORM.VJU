package vn.edu.drl.backend.controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import vn.edu.drl.backend.Wrapper.ApiResponse;
import vn.edu.drl.backend.service.ClassService;
import vn.edu.drl.backend.dto.request.ClassRequest;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/classes")
public class ClassController {
    private final ClassService service;
    public ClassController(ClassService service) { this.service = service; }
    
    @GetMapping
    public ApiResponse<?> getAll() {
        return ApiResponse.success(service.findAll());
    }
    
    @PostMapping
    public ApiResponse<?> create(@Valid @RequestBody ClassRequest req) {
        return ApiResponse.success(service.create(req));
    }

    @PutMapping("/{id}")
    public ApiResponse<?> update(@PathVariable Long id, @Valid @RequestBody ClassRequest req) {
        return ApiResponse.success(service.update(id, req));
    }

    @PutMapping("/{id}/toggle-status")
    public ApiResponse<?> toggleStatus(@PathVariable Long id) {
        return ApiResponse.success(service.toggleStatus(id));
    }

    @GetMapping("/template-excel")
    public org.springframework.http.ResponseEntity<byte[]> downloadTemplate() {
        byte[] data = service.generateExcelTemplate();
        return org.springframework.http.ResponseEntity.ok()
            .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=classes_template.xlsx")
            .body(data);
    }

    @PostMapping("/import")
    public ApiResponse<?> importClasses(@RequestParam("file") MultipartFile file, @RequestParam(value = "dryRun", defaultValue = "false") boolean dryRun) {
        return ApiResponse.success(service.importFromExcel(file, dryRun));
    }
}
