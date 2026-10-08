const fs = require('fs');
let implPath = '../backend-springboot/src/main/java/vn/edu/drl/backend/service/impl/ClassServiceImpl.java';
let impl = fs.readFileSync(implPath, 'utf-8');

// I need to import UserEntity, Role and UserRepository in ClassServiceImpl if not already imported.
if (!impl.includes('import vn.edu.drl.backend.dao.UserRepository;')) {
    impl = impl.replace('import vn.edu.drl.backend.dao.DepartmentRepository;', 'import vn.edu.drl.backend.dao.DepartmentRepository;\nimport vn.edu.drl.backend.dao.UserRepository;\nimport vn.edu.drl.backend.entity.UserEntity;\nimport vn.edu.drl.backend.enu.Role;');
}

const templateAndImport = `
    @Override
    public byte[] generateExcelTemplate() {
        try (Workbook workbook = new XSSFWorkbook(); java.io.ByteArrayOutputStream out = new java.io.ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Import Classes");
            Row header = sheet.createRow(0);
            header.createCell(0).setCellValue("Mã lớp *");
            header.createCell(1).setCellValue("Tên lớp *");
            header.createCell(2).setCellValue("Mã Khoa *");
            header.createCell(3).setCellValue("Niên khóa");
            header.createCell(4).setCellValue("Mã Lớp trưởng (cách nhau dấu phẩy)");
            header.createCell(5).setCellValue("Mã Lớp phó (cách nhau dấu phẩy)");
            
            Row sample = sheet.createRow(1);
            sample.createCell(0).setCellValue("IT01");
            sample.createCell(1).setCellValue("Lớp Công nghệ thông tin 01");
            sample.createCell(2).setCellValue("IT");
            sample.createCell(3).setCellValue("K21");
            sample.createCell(4).setCellValue("user01, user02");
            sample.createCell(5).setCellValue("user03");
            
            workbook.write(out);
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Lỗi tạo template: " + e.getMessage());
        }
    }

    @Override
    public Map<String, Object> importFromExcel(MultipartFile file, boolean dryRun) {
        int validRows = 0;
        int invalidRows = 0;
        List<String> errors = new ArrayList<>();
        
        try (InputStream is = file.getInputStream(); Workbook workbook = new XSSFWorkbook(is)) {
            Sheet sheet = workbook.getSheetAt(0);
            Iterator<Row> rows = sheet.iterator();
            if (rows.hasNext()) rows.next(); // skip header
            
            int rowIndex = 1;
            while (rows.hasNext()) {
                Row row = rows.next();
                rowIndex++;
                if (row.getCell(0) == null || row.getCell(0).getCellType() == CellType.BLANK) continue;
                
                String classCode = getCellVal(row.getCell(0));
                String className = getCellVal(row.getCell(1));
                String deptCode = getCellVal(row.getCell(2));
                String cohort = getCellVal(row.getCell(3));
                String leaderCodesStr = getCellVal(row.getCell(4));
                String deputyCodesStr = getCellVal(row.getCell(5));
                
                if (classCode.isEmpty() || className.isEmpty() || deptCode.isEmpty()) {
                    invalidRows++;
                    errors.add("Dòng " + rowIndex + ": Thiếu dữ liệu bắt buộc (Mã lớp, Tên lớp hoặc Mã Khoa)");
                    continue;
                }
                
                var deptOpt = deptRepo.findByDeptCode(deptCode);
                if (deptOpt.isEmpty()) {
                    invalidRows++;
                    errors.add("Dòng " + rowIndex + ": Mã Khoa '" + deptCode + "' không tồn tại");
                    continue;
                }
                
                // Parse leaders and deputies
                List<String> leaderCodes = Arrays.stream(leaderCodesStr.split(",")).map(String::trim).filter(s -> !s.isEmpty()).toList();
                List<String> deputyCodes = Arrays.stream(deputyCodesStr.split(",")).map(String::trim).filter(s -> !s.isEmpty()).toList();
                
                boolean hasError = false;
                List<UserEntity> validLeaders = new ArrayList<>();
                List<UserEntity> validDeputies = new ArrayList<>();
                
                // Validate intersection
                for (String lc : leaderCodes) {
                    if (deputyCodes.contains(lc)) {
                        errors.add("Dòng " + rowIndex + ": Mã sinh viên '" + lc + "' vừa là Lớp trưởng vừa là Lớp phó");
                        hasError = true;
                    }
                }
                
                if (hasError) {
                    invalidRows++;
                    continue;
                }
                
                // Validate leaders
                for (String lc : leaderCodes) {
                    var userOpt = userRepo.findByUserCode(lc);
                    if (userOpt.isEmpty()) {
                        errors.add("Dòng " + rowIndex + ": Mã sinh viên Lớp trưởng '" + lc + "' không tồn tại");
                        hasError = true;
                    } else {
                        validLeaders.add(userOpt.get());
                    }
                }
                
                // Validate deputies
                for (String dc : deputyCodes) {
                    var userOpt = userRepo.findByUserCode(dc);
                    if (userOpt.isEmpty()) {
                        errors.add("Dòng " + rowIndex + ": Mã sinh viên Lớp phó '" + dc + "' không tồn tại");
                        hasError = true;
                    } else {
                        validDeputies.add(userOpt.get());
                    }
                }
                
                if (hasError) {
                    invalidRows++;
                    continue;
                }
                
                if (!dryRun) {
                    Optional<ClassEntity> opt = repository.findByClassCode(classCode);
                    ClassEntity c = opt.orElseGet(ClassEntity::new);
                    c.setClassCode(classCode);
                    c.setClassName(className);
                    c.setDepartment(deptOpt.get());
                    c.setAcademicCohort(cohort.isEmpty() ? null : cohort);
                    c = repository.save(c);
                    
                    // Clear old leaders/deputies for this class
                    List<UserEntity> oldUsers = userRepo.findByClassEntityId(c.getId());
                    for (UserEntity ou : oldUsers) {
                        if (ou.getRole() == Role.CLASS_LEADER || ou.getRole() == Role.CLASS_DEPUTY) {
                            ou.setRole(Role.STUDENT);
                            userRepo.save(ou);
                        }
                    }
                    
                    // Set new ones
                    for (UserEntity l : validLeaders) {
                        l.setRole(Role.CLASS_LEADER);
                        l.setClassEntity(c);
                        userRepo.save(l);
                    }
                    
                    for (UserEntity d : validDeputies) {
                        d.setRole(Role.CLASS_DEPUTY);
                        d.setClassEntity(c);
                        userRepo.save(d);
                    }
                }
                
                validRows++;
            }
        } catch (Exception e) {
            throw new RuntimeException("Lỗi đọc file: " + e.getMessage());
        }
        
        Map<String, Object> res = new HashMap<>();
        res.put("validRows", validRows);
        res.put("invalidRows", invalidRows);
        res.put("errors", errors);
        return res;
    }
`;

const replaceRegex = /@Override\s*public byte\[\] generateExcelTemplate\(\) \{[\s\S]*?return "";\n    \}/;
impl = impl.replace(replaceRegex, templateAndImport.trim() + "\n\n    private String getCellVal(Cell cell) {\n        if (cell == null) return \"\";\n        if (cell.getCellType() == CellType.STRING) return cell.getStringCellValue().trim();\n        if (cell.getCellType() == CellType.NUMERIC) {\n            double val = cell.getNumericCellValue();\n            if (val == (long) val) return String.valueOf((long) val);\n            return String.valueOf(val);\n        }\n        return \"\";\n    }");

fs.writeFileSync(implPath, impl);
