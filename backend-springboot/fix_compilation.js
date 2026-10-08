const fs = require('fs');
fs.writeFileSync('src/main/java/vn/edu/drl/backend/service/DepartmentService.java', `package vn.edu.drl.backend.service;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import vn.edu.drl.backend.dao.DepartmentRepository;
import vn.edu.drl.backend.model.Department;
import vn.edu.drl.backend.dto.request.DepartmentRequest;
import java.util.List;
import java.util.Map;

public interface DepartmentService {
    List<Department> findAll();
    Department create(DepartmentRequest req);
    Map<String, Object> importFromExcel(MultipartFile file, boolean preview);
}`);

fs.writeFileSync('src/main/java/vn/edu/drl/backend/service/impl/DepartmentServiceImpl.java', `package vn.edu.drl.backend.service.impl;

import vn.edu.drl.backend.service.DepartmentService;
import org.springframework.stereotype.Service;
import vn.edu.drl.backend.dao.DepartmentRepository;
import vn.edu.drl.backend.model.Department;
import vn.edu.drl.backend.dto.request.DepartmentRequest;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.ArrayList;
import java.io.InputStream;
import org.springframework.web.multipart.MultipartFile;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

@Service
public class DepartmentServiceImpl implements DepartmentService {
    private final DepartmentRepository repository;
    public DepartmentServiceImpl(DepartmentRepository repository) { this.repository = repository; }
    
    public List<Department> findAll() { return repository.findAll(); }
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
}`);

fs.writeFileSync('src/main/java/vn/edu/drl/backend/controller/DepartmentController.java', `package vn.edu.drl.backend.controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import vn.edu.drl.backend.Wrapper.ApiResponse;
import vn.edu.drl.backend.service.DepartmentService;
import vn.edu.drl.backend.dto.request.DepartmentRequest;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/departments")
public class DepartmentController {
    private final DepartmentService service;
    public DepartmentController(DepartmentService service) { this.service = service; }
    
    @GetMapping
    public ApiResponse<?> getAll() {
        return ApiResponse.success(service.findAll());
    }
    
    @PostMapping
    public ApiResponse<?> create(@Valid @RequestBody DepartmentRequest req) {
        return ApiResponse.success(service.create(req));
    }
    
    @PostMapping("/import")
    public ApiResponse<?> importExcel(@RequestParam("file") MultipartFile file, 
                                      @RequestParam(defaultValue = "true") boolean preview) {
        return ApiResponse.success(service.importFromExcel(file, preview));
    }
}`);
