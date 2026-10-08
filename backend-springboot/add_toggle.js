const fs = require('fs');

// DepartmentService
let srv = fs.readFileSync('src/main/java/vn/edu/drl/backend/service/DepartmentService.java', 'utf-8');
srv = srv.replace('Map<String, Object> importFromExcel(MultipartFile file, boolean preview);', 'Map<String, Object> importFromExcel(MultipartFile file, boolean preview);\n    Department toggleStatus(Long id);');
fs.writeFileSync('src/main/java/vn/edu/drl/backend/service/DepartmentService.java', srv);

// DepartmentServiceImpl
let impl = fs.readFileSync('src/main/java/vn/edu/drl/backend/service/impl/DepartmentServiceImpl.java', 'utf-8');
let toggleMethod = `    public Department toggleStatus(Long id) {
        Department d = repository.findById(id).orElseThrow(() -> new RuntimeException("Not found"));
        d.setStatus(d.getStatus() == 1 ? 0 : 1);
        return repository.save(d);
    }
}`;
impl = impl.replace('}\n', toggleMethod);
fs.writeFileSync('src/main/java/vn/edu/drl/backend/service/impl/DepartmentServiceImpl.java', impl);

// DepartmentController
let ctrl = fs.readFileSync('src/main/java/vn/edu/drl/backend/controller/DepartmentController.java', 'utf-8');
let putMethod = `    @PutMapping("/{id}/toggle-status")
    public ApiResponse<?> toggleStatus(@PathVariable Long id) {
        return ApiResponse.success(service.toggleStatus(id));
    }
}`;
ctrl = ctrl.replace('}\n', putMethod);
fs.writeFileSync('src/main/java/vn/edu/drl/backend/controller/DepartmentController.java', ctrl);
