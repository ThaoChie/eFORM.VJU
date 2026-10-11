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

@Service
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
            long classesCount = classRepository.countByDepartmentId(d.getId());
            long usersCount = userRepository.countByDepartmentId(d.getId());
            String deanName = "Chưa chỉ định";
            User dean = userRepository.findFirstByDepartmentIdAndRole(d.getId(), vn.edu.drl.backend.enu.Role.DEAN).orElse(null);
            if (dean != null) deanName = dean.getFullName();
            Long deanId = dean != null ? dean.getId() : null;
            return new DepartmentResponse(d, classesCount, usersCount, deanName, deanId);
        }).collect(Collectors.toList());
    }
    
    public Department create(DepartmentRequest req) {
        Department d = new Department();
        d.setDeptCode(req.getDeptCode());
        d.setDeptName(req.getDeptName());
        return repository.save(d);
    }
    
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
            
            if (!preview && !listToSave.isEmpty()) {
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

            public Department toggleStatus(Long id) {
        Department d = repository.findById(id).orElseThrow(() -> new RuntimeException("Not found"));
        if (d.getStatus() == 1) {
            long classesCount = classRepository.countByDepartmentId(d.getId());
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
