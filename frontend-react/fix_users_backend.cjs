const fs = require('fs');
let path = '../backend-springboot/src/main/java/vn/edu/drl/backend/service/impl/UserServiceImpl.java';
let content = fs.readFileSync(path, 'utf-8');

// Replace generateExcelTemplate
const oldTemplateMethod = `public byte[] generateExcelTemplate() {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Users");
            Row header = sheet.createRow(0);
            String[] columns = {"Mã sinh viên", "Họ và tên", "Email", "Role", "Khoa (ID)", "Lớp (ID)", "Khóa"};
            for (int i = 0; i < columns.length; i++) {
                header.createCell(i).setCellValue(columns[i]);
            }
            workbook.write(out);
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Error generating template", e);
        }
    }`;

const newTemplateMethod = `public byte[] generateExcelTemplate() {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Users");
            Row header = sheet.createRow(0);
            String[] columns = {"Mã người dùng", "Họ và tên", "Email", "Vai trò", "Mã khoa", "Mã phòng ban", "Mã lớp", "Niên khóa", "Trạng thái"};
            for (int i = 0; i < columns.length; i++) {
                header.createCell(i).setCellValue(columns[i]);
            }
            workbook.write(out);
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Error generating template", e);
        }
    }`;

content = content.replace(oldTemplateMethod, newTemplateMethod);

const oldImportMethod = `public Map<String, Object> importFromExcel(MultipartFile file, boolean preview) {
        Map<String, Object> result = new HashMap<>();
        List<String> errors = new ArrayList<>();
        int validRows = 0;
        int invalidRows = 0;
        
        try (InputStream is = file.getInputStream(); Workbook workbook = new XSSFWorkbook(is)) {
            Sheet sheet = workbook.getSheetAt(0);
            List<User> usersToSave = new ArrayList<>();
            
            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;
                
                try {
                    String userCode = getCellString(row.getCell(0));
                    String fullName = getCellString(row.getCell(1));
                    String email = getCellString(row.getCell(2));
                    String roleStr = getCellString(row.getCell(3));
                    
                    if (email.isEmpty() || fullName.isEmpty()) {
                        errors.add("Row " + (i + 1) + ": Missing required email or name");
                        invalidRows++;
                        continue;
                    }
                    
                    if (repository.findByEmail(email).isPresent()) {
                        errors.add("Row " + (i + 1) + ": Email already exists");
                        invalidRows++;
                        continue;
                    }
                    
                    User u = new User();
                    u.setUserCode(userCode);
                    u.setFullName(fullName);
                    u.setEmail(email);
                    u.setRole(Role.valueOf(roleStr));
                    u.setPasswordHash("DEFAULT");
                    usersToSave.add(u);
                    validRows++;
                } catch (Exception ex) {
                    errors.add("Row " + (i + 1) + ": Format error - " + ex.getMessage());
                    invalidRows++;
                }
            }
            
            if (!preview && !usersToSave.isEmpty()) {
                repository.saveAll(usersToSave);
            }
            
            result.put("validRows", validRows);
            result.put("invalidRows", invalidRows);
            result.put("errors", errors);
            return result;
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse Excel file", e);
        }
    }`;

const newImportMethod = `public Map<String, Object> importFromExcel(MultipartFile file, boolean preview) {
        Map<String, Object> result = new HashMap<>();
        List<String> errors = new ArrayList<>();
        int validRows = 0;
        int invalidRows = 0;
        
        try (InputStream is = file.getInputStream(); Workbook workbook = new XSSFWorkbook(is)) {
            Sheet sheet = workbook.getSheetAt(0);
            List<User> usersToSave = new ArrayList<>();
            
            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;
                
                try {
                    String userCode = getCellString(row.getCell(0));
                    String fullName = getCellString(row.getCell(1));
                    String email = getCellString(row.getCell(2));
                    String roleStr = getCellString(row.getCell(3));
                    String deptCode = getCellString(row.getCell(4));
                    // String officeCode = getCellString(row.getCell(5)); // Ignored since Office doesn't exist
                    String classCode = getCellString(row.getCell(6));
                    String cohort = getCellString(row.getCell(7));
                    String statusStr = getCellString(row.getCell(8));
                    
                    if (email.isEmpty() || fullName.isEmpty()) {
                        errors.add("Dòng " + (i + 1) + ": Thiếu tên hoặc email");
                        invalidRows++;
                        continue;
                    }
                    
                    if (repository.findByEmail(email).isPresent()) {
                        errors.add("Dòng " + (i + 1) + ": Email đã tồn tại");
                        invalidRows++;
                        continue;
                    }
                    
                    User u = new User();
                    u.setUserCode(userCode);
                    u.setFullName(fullName);
                    u.setEmail(email);
                    try {
                        u.setRole(Role.valueOf(roleStr));
                    } catch (Exception e) {
                        u.setRole(Role.STUDENT);
                    }
                    u.setPasswordHash("DEFAULT");
                    
                    if (!deptCode.isEmpty()) {
                        vn.edu.drl.backend.model.Department d = hibernateDao.getDepartmentByCode(deptCode);
                        if (d != null) u.setDepartment(d);
                    }
                    
                    if (!classCode.isEmpty()) {
                        vn.edu.drl.backend.model.ClassEntity c = hibernateDao.getClassByCode(classCode);
                        if (c != null) u.setClassEntity(c);
                    }
                    
                    u.setAcademicCohort(cohort);
                    u.setStatus("0".equals(statusStr) || "Vô hiệu hóa".equalsIgnoreCase(statusStr) ? 0 : 1);
                    
                    usersToSave.add(u);
                    validRows++;
                } catch (Exception ex) {
                    errors.add("Dòng " + (i + 1) + ": Lỗi định dạng - " + ex.getMessage());
                    invalidRows++;
                }
            }
            
            if (!preview && !usersToSave.isEmpty()) {
                repository.saveAll(usersToSave);
            }
            
            result.put("validRows", validRows);
            result.put("invalidRows", invalidRows);
            result.put("errors", errors);
            return result;
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse Excel file", e);
        }
    }`;

content = content.replace(oldImportMethod, newImportMethod);

fs.writeFileSync(path, content);
