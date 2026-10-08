const fs = require('fs');

let implContent = `package vn.edu.drl.backend.service.impl;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import vn.edu.drl.backend.dao.ClassRepository;
import vn.edu.drl.backend.dao.DepartmentRepository;
import vn.edu.drl.backend.dao.UserRepository;
import vn.edu.drl.backend.dto.request.ClassRequest;
import vn.edu.drl.backend.dto.response.ClassResponse;
import vn.edu.drl.backend.enu.Role;
import vn.edu.drl.backend.model.ClassEntity;
import vn.edu.drl.backend.model.Department;
import vn.edu.drl.backend.model.User;
import vn.edu.drl.backend.service.ClassService;

import java.io.InputStream;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ClassServiceImpl implements ClassService {
    private final ClassRepository repository;
    private final DepartmentRepository deptRepo;
    private final UserRepository userRepo;

    public ClassServiceImpl(ClassRepository repository, DepartmentRepository deptRepo, UserRepository userRepo) {
        this.repository = repository;
        this.deptRepo = deptRepo;
        this.userRepo = userRepo;
    }

    private ClassResponse mapToResponse(ClassEntity c) {
        ClassResponse res = new ClassResponse();
        res.setId(c.getId());
        res.setClassCode(c.getClassCode());
        res.setClassName(c.getClassName());
        res.setAcademicCohort(c.getAcademicCohort());
        res.setStatus(c.getStatus());
        if (c.getDepartment() != null) {
            res.setDeptId(c.getDepartment().getId());
            res.setDeptCode(c.getDepartment().getDeptCode());
            res.setDeptName(c.getDepartment().getDeptName());
            User dean = userRepo.findFirstByDepartmentIdAndRole(c.getDepartment().getId(), Role.DEAN);
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
    public ClassResponse create(ClassRequest req) {
        if (repository.findByClassCode(req.getClassCode()).isPresent()) {
            throw new vn.edu.drl.backend.exception.BusinessException("Mã lớp đã tồn tại");
        }
        ClassEntity c = new ClassEntity();
        c.setClassCode(req.getClassCode());
        c.setClassName(req.getClassName());
        c.setAcademicCohort(req.getAcademicCohort());
        c.setStatus(req.getStatus() != null ? req.getStatus() : 1);
        deptRepo.findById(req.getDeptId()).ifPresent(c::setDepartment);
        ClassEntity saved = repository.save(c);
        updateOfficers(saved.getId(), req.getLeaderIds(), req.getDeputyIds());
        return mapToResponse(saved);
    }

    @Override
    public ClassResponse update(Long id, ClassRequest req) {
        ClassEntity c = repository.findById(id).orElseThrow(() -> new vn.edu.drl.backend.exception.BusinessException("Không tìm thấy lớp"));
        c.setClassName(req.getClassName());
        c.setAcademicCohort(req.getAcademicCohort());
        if (req.getStatus() != null) c.setStatus(req.getStatus());
        if (req.getDeptId() != null) {
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
    public Map<String, Object> importFromExcel(MultipartFile file) {
        int validRows = 0;
        int invalidRows = 0;
        List<Map<String, String>> errors = new ArrayList<>();
        try (InputStream is = file.getInputStream(); Workbook workbook = new XSSFWorkbook(is)) {
            Sheet sheet = workbook.getSheetAt(0);
            Iterator<Row> rows = sheet.iterator();
            if (rows.hasNext()) rows.next();
            while (rows.hasNext()) {
                Row row = rows.next();
                if (row.getCell(0) == null || row.getCell(0).getCellType() == CellType.BLANK) continue;
                
                String classCode = getCellVal(row.getCell(0));
                String className = getCellVal(row.getCell(1));
                String deptCode = getCellVal(row.getCell(2));
                
                if (classCode.isEmpty() || className.isEmpty()) {
                    invalidRows++;
                    continue;
                }
                
                Optional<ClassEntity> opt = repository.findByClassCode(classCode);
                ClassEntity c = opt.orElseGet(ClassEntity::new);
                c.setClassCode(classCode);
                c.setClassName(className);
                
                if (!deptCode.isEmpty()) {
                    deptRepo.findByDeptCode(deptCode).ifPresent(c::setDepartment);
                }
                repository.save(c);
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
    
    private String getCellVal(Cell cell) {
        if (cell == null) return "";
        if (cell.getCellType() == CellType.STRING) return cell.getStringCellValue().trim();
        if (cell.getCellType() == CellType.NUMERIC) return String.valueOf((long) cell.getNumericCellValue());
        return "";
    }
}
`;
fs.writeFileSync('src/main/java/vn/edu/drl/backend/service/impl/ClassServiceImpl.java', implContent);
