const fs = require('fs');

// 1. Add Excel Template to ClassService
let clsSvc = fs.readFileSync('../backend-springboot/src/main/java/vn/edu/drl/backend/service/ClassService.java', 'utf-8');
clsSvc = clsSvc.replace('Map<String, Object> importFromExcel(MultipartFile file);', 'Map<String, Object> importFromExcel(MultipartFile file);\n    byte[] generateExcelTemplate();');
fs.writeFileSync('../backend-springboot/src/main/java/vn/edu/drl/backend/service/ClassService.java', clsSvc);

// 2. Add Excel Template to ClassServiceImpl
let clsSvcImpl = fs.readFileSync('../backend-springboot/src/main/java/vn/edu/drl/backend/service/impl/ClassServiceImpl.java', 'utf-8');
let templateMethod = `
    @Override
    public byte[] generateExcelTemplate() {
        try (Workbook workbook = new XSSFWorkbook(); java.io.ByteArrayOutputStream out = new java.io.ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Import Classes");
            Row header = sheet.createRow(0);
            header.createCell(0).setCellValue("Mã lớp *");
            header.createCell(1).setCellValue("Tên lớp *");
            header.createCell(2).setCellValue("Mã Khoa *");
            
            Row sample = sheet.createRow(1);
            sample.createCell(0).setCellValue("IT01");
            sample.createCell(1).setCellValue("Lớp Công nghệ thông tin 01");
            sample.createCell(2).setCellValue("IT");
            
            workbook.write(out);
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Lỗi tạo template: " + e.getMessage());
        }
    }
`;
clsSvcImpl = clsSvcImpl.replace('public Map<String, Object> importFromExcel', templateMethod + '\n    @Override\n    public Map<String, Object> importFromExcel');
fs.writeFileSync('../backend-springboot/src/main/java/vn/edu/drl/backend/service/impl/ClassServiceImpl.java', clsSvcImpl);

// 3. Add to ClassController
let clsCtrl = fs.readFileSync('../backend-springboot/src/main/java/vn/edu/drl/backend/controller/ClassController.java', 'utf-8');
let tplEndpoint = `
    @GetMapping("/template-excel")
    public org.springframework.http.ResponseEntity<byte[]> downloadTemplate() {
        byte[] data = service.generateExcelTemplate();
        return org.springframework.http.ResponseEntity.ok()
            .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=classes_template.xlsx")
            .body(data);
    }
`;
clsCtrl = clsCtrl.replace('public ApiResponse<?> importClasses', tplEndpoint + '\n    @PostMapping("/import")\n    public ApiResponse<?> importClasses');
fs.writeFileSync('../backend-springboot/src/main/java/vn/edu/drl/backend/controller/ClassController.java', clsCtrl);
