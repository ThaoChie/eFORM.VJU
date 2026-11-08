package vn.edu.drl.backend.service.impl;

import vn.edu.drl.backend.service.DepartmentService;
import org.springframework.stereotype.Service;
import vn.edu.drl.backend.dao.DepartmentRepository;
import vn.edu.drl.backend.dao.ClassRepository;
import vn.edu.drl.backend.dao.UserRepository;
import vn.edu.drl.backend.model.Department;
import vn.edu.drl.backend.model.User;
import vn.edu.drl.backend.dto.request.DepartmentRequest;
import vn.edu.drl.backend.dto.response.DepartmentResponse;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.ArrayList;
import java.io.InputStream;
import org.springframework.web.multipart.MultipartFile;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import java.util.stream.Collectors;

import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class DepartmentServiceImpl implements DepartmentService {
    private final DepartmentRepository repository;
    private final ClassRepository classRepository;
    private final UserRepository userRepository;
    
    public DepartmentServiceImpl(DepartmentRepository repository, ClassRepository classRepository, UserRepository userRepository) { 
        this.repository = repository; 
        this.classRepository = classRepository;
        this.userRepository = userRepository;
    }
    
    public List<DepartmentResponse> findAll() {
        return repository.findAll().stream().map(d -> {
            long classesCount = classRepository.countActiveByDepartmentId(d.getId());
            long usersCount = userRepository.countByDepartmentId(d.getId());
            String deanName = "Chưa chỉ định";
            Long deanId = null;
            List<User> deans = userRepository.findByDepartmentIdAndRole(d.getId(), vn.edu.drl.backend.enu.Role.DEAN);
            if (!deans.isEmpty()) {
                User dean = deans.stream().filter(u -> u.getStatus() != null && u.getStatus() == 1).findFirst().orElse(deans.get(0));
                deanName = dean.getFullName();
                deanId = dean.getId();
            }
            return new DepartmentResponse(d, classesCount, usersCount, deanName, deanId);
        }).collect(Collectors.toList());
    }
    
    @Transactional
    public Department create(DepartmentRequest req) {
        if (repository.findByDeptCode(req.getDeptCode()).isPresent()) {
            throw new vn.edu.drl.backend.exception.BusinessException("Mã Khoa đã tồn tại");
        }
        Department d = new Department();
        d.setDeptCode(req.getDeptCode());
        d.setDeptName(req.getDeptName());
        d.setStatus(req.getStatus() != null ? req.getStatus() : 1);
        return repository.save(d);
    }

    @Transactional
    public Department update(Long id, DepartmentRequest req) {
        Department d = repository.findById(id).orElseThrow(() -> new vn.edu.drl.backend.exception.BusinessException("Không tìm thấy khoa"));
        d.setDeptName(req.getDeptName());
        if (req.getStatus() != null) {
            d.setStatus(req.getStatus());
        }
        return repository.save(d);
    }

    public byte[] generateExcelTemplate() {
        try (Workbook workbook = new XSSFWorkbook(); java.io.ByteArrayOutputStream out = new java.io.ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Khoa");
            Row header = sheet.createRow(0);
            header.createCell(0).setCellValue("Mã Khoa *");
            header.createCell(1).setCellValue("Tên Khoa *");
            header.createCell(2).setCellValue("Trạng thái (1=Hoạt động, 0=Vô hiệu hóa)");

            Row sample = sheet.createRow(1);
            sample.createCell(0).setCellValue("CNTT");
            sample.createCell(1).setCellValue("Khoa Công nghệ Thông tin");
            sample.createCell(2).setCellValue("1");

            workbook.write(out);
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Lỗi tạo template Excel: " + e.getMessage());
        }
    }
    
    @Transactional
    public Map<String, Object> importFromExcel(MultipartFile file, boolean preview) {
        Map<String, Object> result = new HashMap<>();
        List<String> errors = new ArrayList<>();
        int validRows = 0;
        int invalidRows = 0;
        
        List<Department> listToSave = new ArrayList<>();
        DataFormatter formatter = new DataFormatter();
        java.util.Set<String> seenDeptCodes = new java.util.HashSet<>();

        try (InputStream is = file.getInputStream(); Workbook workbook = WorkbookFactory.create(is)) {
            Sheet sheet = workbook.getSheetAt(0);
            
            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (isRowEmpty(row, formatter)) continue;
                
                try {
                    String code = getCellString(formatter, row.getCell(0));
                    String name = getCellString(formatter, row.getCell(1));
                    String statusStr = row.getLastCellNum() > 2 ? getCellString(formatter, row.getCell(2)) : "";
                    
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
                    if (code.length() > 50) {
                        errors.add("Dòng " + (i + 1) + ": Mã Khoa không được vượt quá 50 ký tự");
                        invalidRows++;
                        continue;
                    }
                    if (seenDeptCodes.contains(code.toLowerCase())) {
                        errors.add("Dòng " + (i + 1) + ": Mã Khoa '" + code + "' bị trùng lặp trong file");
                        invalidRows++;
                        continue;
                    }
                    if (repository.findByDeptCode(code).isPresent()) {
                        errors.add("Dòng " + (i + 1) + ": Mã Khoa '" + code + "' đã tồn tại trong hệ thống");
                        invalidRows++;
                        continue;
                    }

                    seenDeptCodes.add(code.toLowerCase());
                    
                    Department d = new Department();
                    d.setDeptCode(code);
                    d.setDeptName(name);
                    d.setStatus("0".equals(statusStr) || "Vô hiệu hóa".equalsIgnoreCase(statusStr) ? 0 : 1);
                    listToSave.add(d);
                    validRows++;
                } catch (Exception ex) {
                    errors.add("Dòng " + (i + 1) + ": Lỗi định dạng - " + ex.getMessage());
                    invalidRows++;
                }
            }
        } catch (Exception e) {
            throw new RuntimeException("Lỗi đọc file Excel: " + e.getMessage(), e);
        }

        if (!preview && !listToSave.isEmpty()) {
            repository.saveAll(listToSave);
        }
        
        result.put("validRows", validRows);
        result.put("invalidRows", invalidRows);
        result.put("errors", errors);
        return result;
    }
    
    private boolean isRowEmpty(Row row, DataFormatter formatter) {
        if (row == null) return true;
        for (int c = row.getFirstCellNum(); c < row.getLastCellNum(); c++) {
            Cell cell = row.getCell(c);
            if (cell != null && cell.getCellType() != CellType.BLANK) {
                String val = formatter.formatCellValue(cell).trim();
                if (!val.isEmpty()) return false;
            }
        }
        return true;
    }

    private String getCellString(DataFormatter formatter, Cell cell) {
        if (cell == null) return "";
        return formatter.formatCellValue(cell).trim();
    }

    @Transactional
    public Department toggleStatus(Long id) {
        Department d = repository.findById(id).orElseThrow(() -> new RuntimeException("Not found"));
        if (d.getStatus() == 1) {
            long classesCount = classRepository.countActiveByDepartmentId(d.getId());
            if (classesCount > 0) {
                throw new RuntimeException("Còn " + classesCount + " lớp trực thuộc đang hoạt động, hãy vô hiệu hóa lớp trước");
            }
            long usersCount = userRepository.countByDepartmentId(d.getId());
            if (usersCount > 0) {
                throw new RuntimeException("Còn " + usersCount + " người dùng trực thuộc đang hoạt động");
            }
        }
        d.setStatus(d.getStatus() == 1 ? 0 : 1);
        return repository.save(d);
    }
}
