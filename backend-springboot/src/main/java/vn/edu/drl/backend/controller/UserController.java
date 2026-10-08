package vn.edu.drl.backend.controller;

import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import vn.edu.drl.backend.Wrapper.ApiResponse;
import vn.edu.drl.backend.dto.request.UserRequest;
import vn.edu.drl.backend.service.UserService;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/directory/users")
public class UserController {
    private final UserService service;
    public UserController(UserService service) { this.service = service; }
    
    @GetMapping
    public ApiResponse<?> getAll(@RequestParam(required = false) Long deptId,
                                 @RequestParam(required = false) Long classId,
                                 @RequestParam(required = false) String cohort,
                                 @RequestParam(required = false) String role) {
        return ApiResponse.success(service.findUsers(deptId, classId, cohort, role));
    }
    
    @PostMapping
    public ApiResponse<?> create(@Valid @RequestBody UserRequest req) {
        return ApiResponse.success(service.create(req));
    }
    
    @GetMapping("/template-excel")
    public ResponseEntity<byte[]> downloadTemplate() {
        byte[] data = service.generateExcelTemplate();
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=user_import_template.xlsx")
            .body(data);
    }
    
    @PostMapping("/import")
    public ApiResponse<?> importExcel(@RequestParam("file") MultipartFile file, 
                                      @RequestParam(defaultValue = "true") boolean preview) {
        return ApiResponse.success(service.importFromExcel(file, preview));
    }
    
    @GetMapping("/export")
    public ResponseEntity<byte[]> exportExcel(@RequestParam(required = false) Long deptId,
                                              @RequestParam(required = false) Long classId,
                                              @RequestParam(required = false) String cohort,
                                              @RequestParam(required = false) String role) {
        byte[] data = service.exportToExcel(deptId, classId, cohort, role);
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=users_export.xlsx")
            .body(data);
    }
}
