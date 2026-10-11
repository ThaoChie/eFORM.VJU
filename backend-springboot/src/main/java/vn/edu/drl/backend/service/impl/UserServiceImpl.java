package vn.edu.drl.backend.service.impl;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.streaming.SXSSFWorkbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import vn.edu.drl.backend.dao.ClassRepository;
import vn.edu.drl.backend.dao.DepartmentRepository;
import vn.edu.drl.backend.dao.UserRepository;
import vn.edu.drl.backend.dto.request.UserRequest;
import vn.edu.drl.backend.dto.response.UserResponse;
import vn.edu.drl.backend.enu.Role;
import vn.edu.drl.backend.hibernateDao.UserHibernateDao;
import vn.edu.drl.backend.model.ClassEntity;
import vn.edu.drl.backend.model.Department;
import vn.edu.drl.backend.model.User;
import vn.edu.drl.backend.service.UserService;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.util.*;

@Service
@Transactional(readOnly = true)
public class UserServiceImpl implements UserService {
    private final UserRepository repository;
    private final UserHibernateDao hibernateDao;
    private final DepartmentRepository deptRepo;
    private final ClassRepository classRepo;
    private final PasswordEncoder passwordEncoder;
    
    public UserServiceImpl(UserRepository repository, 
                           UserHibernateDao hibernateDao, 
                           DepartmentRepository deptRepo, 
                           ClassRepository classRepo, 
                           PasswordEncoder passwordEncoder) { 
        this.repository = repository; 
        this.hibernateDao = hibernateDao;
        this.deptRepo = deptRepo;
        this.classRepo = classRepo;
        this.passwordEncoder = passwordEncoder;
    }
    
    public List<User> findAll() { 
        return repository.findAll(); 
    }
    
    public List<UserResponse> findUsers(Long deptId, Long classId, String cohort, String role) {
        List<User> users = hibernateDao.filterUsers(deptId, classId, cohort, role);
        return users.stream().map(UserResponse::new).toList();
    }
    
    @Transactional
    public UserResponse create(UserRequest req) {
        if (req.getUserCode() != null && !req.getUserCode().trim().isEmpty() && repository.findByUserCode(req.getUserCode().trim()).isPresent()) {
            throw new vn.edu.drl.backend.exception.BusinessException("Mã người dùng '" + req.getUserCode().trim() + "' đã tồn tại trong hệ thống. Vui lòng nhập mã khác.");
        }
        if (req.getEmail() != null && !req.getEmail().trim().isEmpty() && repository.findByEmail(req.getEmail().trim()).isPresent()) {
            throw new vn.edu.drl.backend.exception.BusinessException("Email '" + req.getEmail().trim() + "' đã tồn tại trong hệ thống. Vui lòng nhập email khác.");
        }
        User u = new User();
        u.setEmail(req.getEmail() != null ? req.getEmail().trim() : null);
        u.setFullName(req.getFullName() != null ? req.getFullName().trim() : null);
        u.setUserCode(req.getUserCode() != null ? req.getUserCode().trim() : null);
        try {
            u.setRole(Role.valueOf(req.getRole()));
        } catch (Exception e) {
            u.setRole(Role.STUDENT);
        }
        u.setPasswordHash(passwordEncoder.encode("123456"));
        u.setPositionTitle(req.getPositionTitle());
        u.setAcademicCohort(req.getAcademicCohort());
        if (req.getEffectiveDeptId() != null) {
            deptRepo.findById(req.getEffectiveDeptId()).ifPresent(u::setDepartment);
        }
        if (req.getClassId() != null) {
            classRepo.findById(req.getClassId()).ifPresent(u::setClassEntity);
        }
        u.setStatus(1);
        User saved = repository.save(u);
        return new UserResponse(saved);
    }

    @Transactional
    public UserResponse update(Long id, UserRequest req) {
        User u = repository.findById(id).orElseThrow(() -> new vn.edu.drl.backend.exception.BusinessException("Không tìm thấy người dùng"));
        if (req.getUserCode() != null && !req.getUserCode().trim().isEmpty()) {
            repository.findByUserCode(req.getUserCode().trim()).ifPresent(existing -> {
                if (!existing.getId().equals(id)) {
                    throw new vn.edu.drl.backend.exception.BusinessException("Mã người dùng '" + req.getUserCode().trim() + "' đã tồn tại trong hệ thống.");
                }
            });
        }
        if (req.getEmail() != null && !req.getEmail().trim().isEmpty()) {
            repository.findByEmail(req.getEmail().trim()).ifPresent(existing -> {
                if (!existing.getId().equals(id)) {
                    throw new vn.edu.drl.backend.exception.BusinessException("Email '" + req.getEmail().trim() + "' đã tồn tại trong hệ thống.");
                }
            });
        }
        u.setFullName(req.getFullName() != null ? req.getFullName().trim() : u.getFullName());
        u.setEmail(req.getEmail() != null ? req.getEmail().trim() : u.getEmail());
        if (req.getRole() != null) {
            try {
                u.setRole(Role.valueOf(req.getRole()));
            } catch (Exception ignored) {}
        }
        u.setPositionTitle(req.getPositionTitle());
        u.setAcademicCohort(req.getAcademicCohort());
        if (req.getEffectiveDeptId() != null) {
            deptRepo.findById(req.getEffectiveDeptId()).ifPresent(u::setDepartment);
        } else {
            u.setDepartment(null);
        }
        if (req.getClassId() != null) {
            classRepo.findById(req.getClassId()).ifPresent(u::setClassEntity);
        } else {
            u.setClassEntity(null);
        }
        User saved = repository.save(u);
        return new UserResponse(saved);
    }

    @Transactional
    public UserResponse toggleStatus(Long id) {
        User u = repository.findById(id).orElseThrow(() -> new RuntimeException("Not found"));
        u.setStatus(u.getStatus() != null && u.getStatus() == 1 ? 0 : 1);
        User saved = repository.save(u);
        return new UserResponse(saved);
    }
    
    public byte[] generateExcelTemplate() {
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
    }
    
    @Transactional
    public Map<String, Object> importFromExcel(MultipartFile file, boolean preview) {
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
                    u.setPasswordHash(passwordEncoder.encode("123456"));
                    
                    if (!deptCode.isEmpty()) {
                        Department d = deptRepo.findByDeptCode(deptCode).orElse(null);
                        if (d != null) u.setDepartment(d);
                    }
                    
                    if (!classCode.isEmpty()) {
                        ClassEntity c = classRepo.findByClassCode(classCode).orElse(null);
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
    }
    
    public byte[] exportToExcel(Long deptId, Long classId, String cohort, String role) {
        List<User> users = hibernateDao.filterUsers(deptId, classId, cohort, role);
        try (SXSSFWorkbook workbook = new SXSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Export");
            Row header = sheet.createRow(0);
            String[] columns = {"STT", "Họ và tên", "Mã sinh viên", "Khóa", "Email", "Role"};
            for (int i = 0; i < columns.length; i++) {
                header.createCell(i).setCellValue(columns[i]);
            }
            
            int rowIdx = 1;
            for (User u : users) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(rowIdx - 1);
                row.createCell(1).setCellValue(u.getFullName() != null ? u.getFullName() : "");
                row.createCell(2).setCellValue(u.getUserCode() != null ? u.getUserCode() : "");
                row.createCell(3).setCellValue(u.getAcademicCohort() != null ? u.getAcademicCohort() : "");
                row.createCell(4).setCellValue(u.getEmail() != null ? u.getEmail() : "");
                row.createCell(5).setCellValue(u.getRole() != null ? u.getRole().name() : "");
            }
            workbook.write(out);
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Export failed", e);
        }
    }
    
    private String getCellString(Cell cell) {
        if (cell == null) return "";
        if (cell.getCellType() == CellType.STRING) return cell.getStringCellValue();
        if (cell.getCellType() == CellType.NUMERIC) return String.valueOf((long)cell.getNumericCellValue());
        return "";
    }
}
