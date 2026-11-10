package vn.edu.drl.backend.service.impl;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import vn.edu.drl.backend.dao.ClassRepository;
import vn.edu.drl.backend.dao.DepartmentRepository;
import vn.edu.drl.backend.dao.MajorRepository;
import vn.edu.drl.backend.dao.UserRepository;
import vn.edu.drl.backend.dto.request.ClassRequest;
import vn.edu.drl.backend.dto.response.ClassResponse;
import vn.edu.drl.backend.enu.Role;
import vn.edu.drl.backend.model.ClassEntity;
import vn.edu.drl.backend.model.Department;
import vn.edu.drl.backend.model.Major;
import vn.edu.drl.backend.model.User;
import vn.edu.drl.backend.service.ClassService;

import java.io.InputStream;
import java.util.*;
import java.util.stream.Collectors;

import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class ClassServiceImpl implements ClassService {
    private final ClassRepository repository;
    private final DepartmentRepository deptRepo;
    private final MajorRepository majorRepo;
    private final UserRepository userRepo;

    public ClassServiceImpl(ClassRepository repository, DepartmentRepository deptRepo, MajorRepository majorRepo, UserRepository userRepo) {
        this.repository = repository;
        this.deptRepo = deptRepo;
        this.majorRepo = majorRepo;
        this.userRepo = userRepo;
    }

    private ClassResponse mapToResponse(ClassEntity c) {
        ClassResponse res = new ClassResponse();
        res.setId(c.getId());
        res.setClassCode(c.getClassCode());
        res.setClassName(c.getClassName());
        res.setAcademicCohort(c.getAcademicCohort());
        res.setStatus(c.getStatus());
        if (c.getMajor() != null) {
            res.setMajorId(c.getMajor().getId());
            res.setMajorCode(c.getMajor().getMajorCode());
            res.setMajorName(c.getMajor().getMajorName());
        }
        if (c.getDepartment() != null) {
            res.setDeptId(c.getDepartment().getId());
            res.setDeptCode(c.getDepartment().getDeptCode());
            res.setDeptName(c.getDepartment().getDeptName());
            User dean = userRepo.findFirstByDepartmentIdAndRole(c.getDepartment().getId(), Role.DEAN).orElse(null);
            if (dean != null) {
                res.setDeanName(dean.getFullName());
            }
        } else if (c.getMajor() != null && c.getMajor().getDepartment() != null) {
            res.setDeptId(c.getMajor().getDepartment().getId());
            res.setDeptCode(c.getMajor().getDepartment().getDeptCode());
            res.setDeptName(c.getMajor().getDepartment().getDeptName());
            User dean = userRepo.findFirstByDepartmentIdAndRole(c.getMajor().getDepartment().getId(), Role.DEAN).orElse(null);
            if (dean != null) {
                res.setDeanName(dean.getFullName());
            }
        }
        res.setStudentCount(userRepo.countByClassEntityId(c.getId()));

        List<User> leaders = userRepo.findByClassEntityIdAndRole(c.getId(), Role.CLASS_LEADER);
        res.setLeaders(leaders.stream().map(u -> {
            ClassResponse.UserDto d = new ClassResponse.UserDto();
            d.setId(u.getId());
            d.setUserCode(u.getUserCode());
            d.setFullName(u.getFullName());
            return d;
        }).collect(Collectors.toList()));

        List<User> deputies = userRepo.findByClassEntityIdAndRole(c.getId(), Role.CLASS_DEPUTY);
        res.setDeputies(deputies.stream().map(u -> {
            ClassResponse.UserDto d = new ClassResponse.UserDto();
            d.setId(u.getId());
            d.setUserCode(u.getUserCode());
            d.setFullName(u.getFullName());
            return d;
        }).collect(Collectors.toList()));

        return res;
    }

    @Override
    public List<ClassResponse> findAll() {
        return repository.findAll().stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public ClassResponse create(ClassRequest req) {
        if (repository.findByClassCode(req.getClassCode()).isPresent()) {
            throw new vn.edu.drl.backend.exception.BusinessException("Mã lớp đã tồn tại");
        }
        ClassEntity c = new ClassEntity();
        c.setClassCode(req.getClassCode());
        c.setClassName(req.getClassName());
        c.setAcademicCohort(req.getAcademicCohort());
        c.setStatus(req.getStatus() != null ? req.getStatus() : 1);
        if (req.getMajorId() != null) {
            majorRepo.findById(req.getMajorId()).ifPresent(m -> {
                c.setMajor(m);
                if (m.getDepartment() != null) {
                    c.setDepartment(m.getDepartment());
                }
            });
        } else if (req.getDeptId() != null) {
            deptRepo.findById(req.getDeptId()).ifPresent(c::setDepartment);
        }
        ClassEntity saved = repository.save(c);
        updateOfficers(saved.getId(), req.getLeaderIds(), req.getDeputyIds());
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public ClassResponse update(Long id, ClassRequest req) {
        ClassEntity c = repository.findById(id).orElseThrow(() -> new vn.edu.drl.backend.exception.BusinessException("Không tìm thấy lớp"));
        c.setClassName(req.getClassName());
        c.setAcademicCohort(req.getAcademicCohort());
        if (req.getStatus() != null) c.setStatus(req.getStatus());
        if (req.getMajorId() != null) {
            majorRepo.findById(req.getMajorId()).ifPresent(m -> {
                c.setMajor(m);
                if (m.getDepartment() != null) {
                    c.setDepartment(m.getDepartment());
                }
            });
        } else if (req.getDeptId() != null) {
            deptRepo.findById(req.getDeptId()).ifPresent(c::setDepartment);
        }
        ClassEntity saved = repository.save(c);
        updateOfficers(saved.getId(), req.getLeaderIds(), req.getDeputyIds());
        return mapToResponse(saved);
    }

    private void updateOfficers(Long classId, List<Long> newLeaderIds, List<Long> newDeputyIds) {
        if (newLeaderIds == null) newLeaderIds = new ArrayList<>();
        if (newDeputyIds == null) newDeputyIds = new ArrayList<>();

        List<User> currentLeaders = userRepo.findByClassEntityIdAndRole(classId, Role.CLASS_LEADER);
        for (User u : currentLeaders) {
            if (!newLeaderIds.contains(u.getId())) {
                u.setRole(Role.STUDENT);
                userRepo.save(u);
            }
        }
        List<User> currentDeputies = userRepo.findByClassEntityIdAndRole(classId, Role.CLASS_DEPUTY);
        for (User u : currentDeputies) {
            if (!newDeputyIds.contains(u.getId())) {
                u.setRole(Role.STUDENT);
                userRepo.save(u);
            }
        }

        for (Long id : newLeaderIds) {
            userRepo.findById(id).ifPresent(u -> {
                u.setRole(Role.CLASS_LEADER);
                ClassEntity ce = new ClassEntity(); ce.setId(classId);
                u.setClassEntity(ce);
                userRepo.save(u);
            });
        }
        for (Long id : newDeputyIds) {
            userRepo.findById(id).ifPresent(u -> {
                u.setRole(Role.CLASS_DEPUTY);
                ClassEntity ce = new ClassEntity(); ce.setId(classId);
                u.setClassEntity(ce);
                userRepo.save(u);
            });
        }
    }

    @Override
    @Transactional
    public ClassResponse toggleStatus(Long id) {
        ClassEntity c = repository.findById(id).orElseThrow(() -> new vn.edu.drl.backend.exception.BusinessException("Không tìm thấy lớp"));
        if (c.getStatus() == 1) {
            long students = userRepo.countByClassEntityId(c.getId());
            if (students > 0) {
                throw new vn.edu.drl.backend.exception.BusinessException("Không thể vô hiệu hóa vì còn " + students + " sinh viên đang hoạt động trong lớp");
            }
        }
        c.setStatus(c.getStatus() == 1 ? 0 : 1);
        return mapToResponse(repository.save(c));
    }

    @Override
    public byte[] generateExcelTemplate() {
        try (Workbook workbook = new XSSFWorkbook(); java.io.ByteArrayOutputStream out = new java.io.ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Import Classes");
            Row header = sheet.createRow(0);
            header.createCell(0).setCellValue("Mã lớp *");
            header.createCell(1).setCellValue("Tên lớp *");
            header.createCell(2).setCellValue("Mã Ngành *");
            header.createCell(3).setCellValue("Niên khóa (ví dụ: 2023-2027)");
            header.createCell(4).setCellValue("Mã Lớp trưởng (cách nhau dấu phẩy)");
            header.createCell(5).setCellValue("Mã Lớp phó (cách nhau dấu phẩy)");
            header.createCell(6).setCellValue("Trạng thái (1=Hoạt động, 0=Vô hiệu hóa)");
            
            Row sample = sheet.createRow(1);
            sample.createCell(0).setCellValue("IT01");
            sample.createCell(1).setCellValue("Lớp Công nghệ thông tin 01");
            sample.createCell(2).setCellValue("BCSE");
            sample.createCell(3).setCellValue("2023-2027");
            sample.createCell(4).setCellValue("SV2026001");
            sample.createCell(5).setCellValue("SV2026002");
            sample.createCell(6).setCellValue("1");
            
            workbook.write(out);
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Lỗi tạo template: " + e.getMessage());
        }
    }

    @Override
    @Transactional
    public Map<String, Object> importFromExcel(MultipartFile file, boolean dryRun) {
        int validRows = 0;
        int invalidRows = 0;
        List<String> errors = new ArrayList<>();
        DataFormatter formatter = new DataFormatter();
        Set<String> seenClassCodes = new HashSet<>();
        
        try (InputStream is = file.getInputStream(); Workbook workbook = WorkbookFactory.create(is)) {
            Sheet sheet = workbook.getSheetAt(0);
            if (sheet.getPhysicalNumberOfRows() <= 1) {
                return Map.of(
                    "validRows", 0,
                    "invalidRows", 0,
                    "errors", List.of("File Excel không có dữ liệu để nhập.")
                );
            }

            // Detect column indices dynamically
            Row headerRow = sheet.getRow(0);
            Map<String, Integer> colMap = new HashMap<>();
            if (headerRow != null) {
                for (int c = 0; c < headerRow.getLastCellNum(); c++) {
                    String h = getCellVal(formatter, headerRow.getCell(c)).toLowerCase().trim();
                    if (h.contains("mã lớp") || (h.startsWith("mã") && !h.contains("ngành") && !h.contains("khoa") && !h.contains("trưởng") && !h.contains("phó"))) {
                        colMap.put("classCode", c);
                    } else if (h.contains("tên lớp") || (h.contains("tên") && !h.contains("khoa") && !h.contains("ngành"))) {
                        colMap.put("className", c);
                    } else if (h.contains("ngành") || h.contains("khoa") || h.contains("major") || h.contains("dept")) {
                        colMap.put("majorOrDept", c);
                    } else if (h.contains("khóa") || h.contains("khoá") || h.contains("cohort")) {
                        colMap.put("cohort", c);
                    } else if (h.contains("trưởng") || h.contains("leader")) {
                        colMap.put("leader", c);
                    } else if (h.contains("phó") || h.contains("deputy")) {
                        colMap.put("deputy", c);
                    } else if (h.contains("trạng thái") || h.contains("status")) {
                        colMap.put("status", c);
                    }
                }
            }

            boolean hasDynamicHeaders = colMap.containsKey("classCode") && colMap.containsKey("className");
            
            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (isRowEmpty(row, formatter)) continue;
                
                int rowIndex = i + 1;
                String classCode, className, deptCode, cohort, leaderCodesStr, deputyCodesStr, statusStr;
                if (hasDynamicHeaders) {
                    classCode = colMap.containsKey("classCode") ? getCellVal(formatter, row.getCell(colMap.get("classCode"))) : "";
                    className = colMap.containsKey("className") ? getCellVal(formatter, row.getCell(colMap.get("className"))) : "";
                    deptCode = colMap.containsKey("majorOrDept") ? getCellVal(formatter, row.getCell(colMap.get("majorOrDept"))) : "";
                    cohort = colMap.containsKey("cohort") ? getCellVal(formatter, row.getCell(colMap.get("cohort"))) : "";
                    leaderCodesStr = colMap.containsKey("leader") ? getCellVal(formatter, row.getCell(colMap.get("leader"))) : "";
                    deputyCodesStr = colMap.containsKey("deputy") ? getCellVal(formatter, row.getCell(colMap.get("deputy"))) : "";
                    statusStr = colMap.containsKey("status") ? getCellVal(formatter, row.getCell(colMap.get("status"))) : "1";
                } else {
                    classCode = getCellVal(formatter, row.getCell(0));
                    className = getCellVal(formatter, row.getCell(1));
                    deptCode = getCellVal(formatter, row.getCell(2));
                    cohort = getCellVal(formatter, row.getCell(3));
                    leaderCodesStr = getCellVal(formatter, row.getCell(4));
                    deputyCodesStr = getCellVal(formatter, row.getCell(5));
                    statusStr = row.getCell(6) != null ? getCellVal(formatter, row.getCell(6)) : "1";
                }
                
                if (classCode.isEmpty() || className.isEmpty() || deptCode.isEmpty()) {
                    invalidRows++;
                    errors.add("Dòng " + rowIndex + ": Thiếu dữ liệu bắt buộc (Mã lớp, Tên lớp hoặc Mã Ngành/Khoa)");
                    continue;
                }
                
                if (classCode.length() > 50) {
                    invalidRows++;
                    errors.add("Dòng " + rowIndex + ": Mã lớp không được vượt quá 50 ký tự");
                    continue;
                }

                if (seenClassCodes.contains(classCode.toLowerCase())) {
                    invalidRows++;
                    errors.add("Dòng " + rowIndex + ": Mã lớp '" + classCode + "' bị trùng lặp trong file tải lên");
                    continue;
                }

                if (repository.findByClassCode(classCode).isPresent()) {
                    invalidRows++;
                    errors.add("Dòng " + rowIndex + ": Mã lớp '" + classCode + "' đã tồn tại trong hệ thống");
                    continue;
                }

                seenClassCodes.add(classCode.toLowerCase());
                
                var majorOpt = majorRepo.findByMajorCode(deptCode);
                var deptOpt = deptRepo.findByDeptCode(deptCode);
                if (majorOpt.isEmpty() && deptOpt.isEmpty()) {
                    invalidRows++;
                    errors.add("Dòng " + rowIndex + ": Mã Ngành hoặc Mã Khoa '" + deptCode + "' không tồn tại trong hệ thống");
                    continue;
                }
                
                // Parse leaders and deputies
                List<String> leaderCodes = Arrays.stream(leaderCodesStr.split(",")).map(String::trim).filter(s -> !s.isEmpty()).toList();
                List<String> deputyCodes = Arrays.stream(deputyCodesStr.split(",")).map(String::trim).filter(s -> !s.isEmpty()).toList();
                
                boolean hasError = false;
                List<User> validLeaders = new ArrayList<>();
                List<User> validDeputies = new ArrayList<>();
                
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
                        errors.add("Dòng " + rowIndex + ": Mã sinh viên Lớp trưởng '" + lc + "' không tồn tại trong hệ thống");
                        hasError = true;
                    } else {
                        validLeaders.add(userOpt.get());
                    }
                }
                
                // Validate deputies
                for (String dc : deputyCodes) {
                    var userOpt = userRepo.findByUserCode(dc);
                    if (userOpt.isEmpty()) {
                        errors.add("Dòng " + rowIndex + ": Mã sinh viên Lớp phó '" + dc + "' không tồn tại trong hệ thống");
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
                    if (majorOpt.isPresent()) {
                        c.setMajor(majorOpt.get());
                        if (majorOpt.get().getDepartment() != null) {
                            c.setDepartment(majorOpt.get().getDepartment());
                        }
                    } else if (deptOpt.isPresent()) {
                        c.setDepartment(deptOpt.get());
                    }
                    c.setAcademicCohort(cohort.isEmpty() ? null : cohort);
                    c.setStatus("0".equals(statusStr.trim()) ? 0 : 1);
                    c = repository.save(c);
                    
                    // Clear old leaders/deputies for this class
                    List<User> oldUsers = userRepo.findByClassEntityId(c.getId());
                    for (User ou : oldUsers) {
                        if (ou.getRole() == Role.CLASS_LEADER || ou.getRole() == Role.CLASS_DEPUTY) {
                            ou.setRole(Role.STUDENT);
                            userRepo.save(ou);
                        }
                    }
                    
                    // Set new ones
                    for (User l : validLeaders) {
                        l.setRole(Role.CLASS_LEADER);
                        l.setClassEntity(c);
                        if (l.getDepartment() == null && c.getDepartment() != null) {
                            l.setDepartment(c.getDepartment());
                        }
                        if ((l.getAcademicCohort() == null || l.getAcademicCohort().trim().isEmpty()) && c.getAcademicCohort() != null) {
                            l.setAcademicCohort(c.getAcademicCohort());
                        }
                        userRepo.save(l);
                    }
                    
                    for (User d : validDeputies) {
                        d.setRole(Role.CLASS_DEPUTY);
                        d.setClassEntity(c);
                        if (d.getDepartment() == null && c.getDepartment() != null) {
                            d.setDepartment(c.getDepartment());
                        }
                        if ((d.getAcademicCohort() == null || d.getAcademicCohort().trim().isEmpty()) && c.getAcademicCohort() != null) {
                            d.setAcademicCohort(c.getAcademicCohort());
                        }
                        userRepo.save(d);
                    }
                }
                
                validRows++;
            }
        } catch (Exception e) {
            throw new RuntimeException("Lỗi đọc file: " + e.getMessage(), e);
        }
        
        Map<String, Object> res = new HashMap<>();
        res.put("validRows", validRows);
        res.put("invalidRows", invalidRows);
        res.put("errors", errors);
        return res;
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

    private String getCellVal(DataFormatter formatter, Cell cell) {
        if (cell == null) return "";
        return formatter.formatCellValue(cell).trim();
    }
}
