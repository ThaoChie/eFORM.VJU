package vn.edu.drl.backend.controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import vn.edu.drl.backend.Wrapper.ApiResponse;
import vn.edu.drl.backend.service.DepartmentService;
import vn.edu.drl.backend.dto.request.DepartmentRequest;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/departments")
public class DepartmentController {
    private final DepartmentService service;
    public DepartmentController(DepartmentService service) { this.service = service; }
    
    @GetMapping
    public ApiResponse<?> getAll() {
        return ApiResponse.success(service.findAll());
    }
    
    @PostMapping
    public ApiResponse<?> create(@Valid @RequestBody DepartmentRequest req) {
        return ApiResponse.success(service.create(req));
    }

    @PutMapping("/{id}")
    public ApiResponse<?> update(@PathVariable Long id, @RequestBody DepartmentRequest req) {
        return ApiResponse.success(service.update(id, req));
    }

    @GetMapping("/template-excel")
    public org.springframework.http.ResponseEntity<byte[]> downloadTemplate() {
        byte[] data = service.generateExcelTemplate();
        return org.springframework.http.ResponseEntity.ok()
            .contentType(org.springframework.http.MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
            .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=departments_template.xlsx")
            .body(data);
    }
    
    @PostMapping("/import")
    public ApiResponse<?> importExcel(@RequestParam("file") MultipartFile file, 
                                      @RequestParam(defaultValue = "true") boolean preview) {
        return ApiResponse.success(service.importFromExcel(file, preview));
    }

    @PutMapping("/{id}/toggle-status")
    public ApiResponse<?> toggleStatus(@PathVariable Long id) {
        return ApiResponse.success(service.toggleStatus(id));
    }
}