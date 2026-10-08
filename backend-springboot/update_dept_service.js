const fs = require('fs');

let content = fs.readFileSync('src/main/java/vn/edu/drl/backend/service/DepartmentService.java', 'utf-8');
content = content.replace('import java.util.List;', 'import java.util.List;\nimport java.util.Map;\nimport org.springframework.web.multipart.MultipartFile;');
content = content.replace('Department create(DepartmentRequest req);', 'Department create(DepartmentRequest req);\n    Map<String, Object> importFromExcel(MultipartFile file, boolean preview);');
fs.writeFileSync('src/main/java/vn/edu/drl/backend/service/DepartmentService.java', content);

let implContent = fs.readFileSync('src/main/java/vn/edu/drl/backend/service/impl/DepartmentServiceImpl.java', 'utf-8');
implContent = implContent.replace('import java.util.List;', 'import java.util.List;\nimport java.util.Map;\nimport java.util.HashMap;\nimport java.util.ArrayList;\nimport java.io.InputStream;\nimport org.springframework.web.multipart.MultipartFile;\nimport org.apache.poi.ss.usermodel.*;\nimport org.apache.poi.xssf.usermodel.XSSFWorkbook;');

const importImpl = `
    public Map<String, Object> importFromExcel(MultipartFile file, boolean preview) {
        Map<String, Object> result = new HashMap<>();
        List<String> errors = new ArrayList<>();
        int validRows = 0;
        int invalidRows = 0;
        
        try (InputStream is = file.getInputStream(); Workbook workbook = new XSSFWorkbook(is)) {
            Sheet sheet = workbook.getSheetAt(0);
            List<Department> listToSave = new ArrayList<>();
            
            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;
                
                try {
                    String code = getCellString(row.getCell(0));
                    String name = getCellString(row.getCell(1));
                    
                    if (code.isEmpty()) {
                        errors.add("Dòng " + (i + 1) + ": Mã Khoa không được để trống");
                        invalidRows++;
                        continue;
                    }
                    if (name.isEmpty()) {
                        errors.add("Dòng " + (i + 1) + ": Tên Khoa không được để trống");
                        invalidRows++;
                        continue;
                    }
                    
                    if (repository.findByDeptCode(code).isPresent()) {
                        errors.add("Dòng " + (i + 1) + ": Mã Khoa đã tồn tại");
                        invalidRows++;
                        continue;
                    }
                    
                    Department d = new Department();
                    d.setDeptCode(code);
                    d.setDeptName(name);
                    listToSave.add(d);
                    validRows++;
                } catch (Exception ex) {
                    errors.add("Dòng " + (i + 1) + ": Format error - " + ex.getMessage());
                    invalidRows++;
                }
            }
            
            if (!preview && errors.isEmpty()) {
                repository.saveAll(listToSave);
            }
            
            result.put("validRows", validRows);
            result.put("invalidRows", invalidRows);
            result.put("errors", errors);
            return result;
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse Excel file", e);
        }
    }
    
    private String getCellString(Cell cell) {
        if (cell == null) return "";
        if (cell.getCellType() == CellType.STRING) return cell.getStringCellValue();
        if (cell.getCellType() == CellType.NUMERIC) return String.valueOf((long)cell.getNumericCellValue());
        return "";
    }
}
`;
implContent = implContent.replace('}\n', importImpl);
fs.writeFileSync('src/main/java/vn/edu/drl/backend/service/impl/DepartmentServiceImpl.java', implContent);

let ctrlContent = fs.readFileSync('src/main/java/vn/edu/drl/backend/controller/DepartmentController.java', 'utf-8');
ctrlContent = ctrlContent.replace('import jakarta.validation.Valid;', 'import jakarta.validation.Valid;\nimport org.springframework.web.multipart.MultipartFile;');
const ctrlImport = `
    @PostMapping("/import")
    public ApiResponse<?> importExcel(@RequestParam("file") MultipartFile file, 
                                      @RequestParam(defaultValue = "true") boolean preview) {
        return ApiResponse.success(service.importFromExcel(file, preview));
    }
}`;
ctrlContent = ctrlContent.replace('}\n', ctrlImport);
fs.writeFileSync('src/main/java/vn/edu/drl/backend/controller/DepartmentController.java', ctrlContent);
