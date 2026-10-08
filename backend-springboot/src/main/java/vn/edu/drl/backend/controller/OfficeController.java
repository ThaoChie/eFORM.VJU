package vn.edu.drl.backend.controller;

import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import vn.edu.drl.backend.Wrapper.ApiResponse;
import vn.edu.drl.backend.dto.request.OfficeRequest;
import vn.edu.drl.backend.service.OfficeService;

@RestController
@RequestMapping("/api/v1/offices")
public class OfficeController {

    private final OfficeService service;

    public OfficeController(OfficeService service) {
        this.service = service;
    }

    @GetMapping
    public ApiResponse<?> getAll() {
        return ApiResponse.success(service.findAll());
    }

    @PostMapping
    public ApiResponse<?> create(@RequestBody OfficeRequest req) {
        return ApiResponse.success(service.create(req));
    }

    @PutMapping("/{id}")
    public ApiResponse<?> update(@PathVariable Long id, @RequestBody OfficeRequest req) {
        return ApiResponse.success(service.update(id, req));
    }

    @PutMapping("/{id}/toggle-status")
    public ApiResponse<?> toggleStatus(@PathVariable Long id) {
        return ApiResponse.success(service.toggleStatus(id));
    }

    @GetMapping("/template-excel")
    public ResponseEntity<byte[]> downloadTemplate() {
        byte[] data = service.generateExcelTemplate();
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=office_import_template.xlsx")
            .body(data);
    }

    @GetMapping("/export")
    public ResponseEntity<byte[]> exportExcel() {
        byte[] data = service.exportToExcel();
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=offices_export.xlsx")
            .body(data);
    }

    @PostMapping("/import")
    public ApiResponse<?> importExcel(@RequestParam("file") MultipartFile file,
                                      @RequestParam(defaultValue = "true") boolean preview) {
        return ApiResponse.success(service.importFromExcel(file, preview));
    }
}
