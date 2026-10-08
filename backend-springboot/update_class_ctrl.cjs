const fs = require('fs');
let ctrlPath = 'src/main/java/vn/edu/drl/backend/controller/ClassController.java';
let ctrlContent = `package vn.edu.drl.backend.controller;
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

    @PostMapping("/import")
    public ApiResponse<?> importClasses(@RequestParam("file") MultipartFile file) {
        return ApiResponse.success(service.importFromExcel(file));
    }
}
`;
fs.writeFileSync(ctrlPath, ctrlContent);
