const fs = require('fs');

// 1. Update ClassController.java
let ctrlPath = '../backend-springboot/src/main/java/vn/edu/drl/backend/controller/ClassController.java';
let ctrl = fs.readFileSync(ctrlPath, 'utf-8');
ctrl = ctrl.replace(
    'public ApiResponse<?> importClasses(@RequestParam("file") MultipartFile file) {',
    'public ApiResponse<?> importClasses(@RequestParam("file") MultipartFile file, @RequestParam(value = "dryRun", defaultValue = "false") boolean dryRun) {'
);
ctrl = ctrl.replace(
    'return ApiResponse.success(service.importFromExcel(file));',
    'return ApiResponse.success(service.importFromExcel(file, dryRun));'
);
fs.writeFileSync(ctrlPath, ctrl);

// 2. Update ClassService.java
let svcPath = '../backend-springboot/src/main/java/vn/edu/drl/backend/service/ClassService.java';
let svc = fs.readFileSync(svcPath, 'utf-8');
svc = svc.replace(
    'Map<String, Object> importFromExcel(MultipartFile file);',
    'Map<String, Object> importFromExcel(MultipartFile file, boolean dryRun);'
);
fs.writeFileSync(svcPath, svc);

