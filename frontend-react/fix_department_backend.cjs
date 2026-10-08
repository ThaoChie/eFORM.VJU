const fs = require('fs');
let reqPath = '../backend-springboot/src/main/java/vn/edu/drl/backend/dto/request/DepartmentRequest.java';
let content = fs.readFileSync(reqPath, 'utf-8');
if (!content.includes('private Integer status')) {
    content = content.replace(
        'private String deptName;',
        'private String deptName;\n    private Integer status;\n    private Long deanId;'
    );
    fs.writeFileSync(reqPath, content);
}

let svcPath = '../backend-springboot/src/main/java/vn/edu/drl/backend/service/impl/DepartmentServiceImpl.java';
let svcContent = fs.readFileSync(svcPath, 'utf-8');
const oldUpdate = `public DepartmentResponse update(Long id, DepartmentRequest req) {
        Department d = repository.findById(id).orElseThrow(() -> new RuntimeException("Khoa không tồn tại"));
        d.setDeptName(req.getDeptName());
        repository.save(d);
        return getDepartmentResponse(d);
    }`;
const newUpdate = `public DepartmentResponse update(Long id, DepartmentRequest req) {
        Department d = repository.findById(id).orElseThrow(() -> new RuntimeException("Khoa không tồn tại"));
        d.setDeptName(req.getDeptName());
        if (req.getStatus() != null) {
            d.setStatus(req.getStatus());
        }
        repository.save(d);
        
        if (req.getDeanId() != null) {
            // Unset old dean
            userRepository.findFirstByDepartmentIdAndRole(d.getId(), vn.edu.drl.backend.enu.Role.DEAN).ifPresent(oldDean -> {
                oldDean.setRole(vn.edu.drl.backend.enu.Role.STUDENT);
                userRepository.save(oldDean);
            });
            // Set new dean
            User newDean = userRepository.findById(req.getDeanId()).orElse(null);
            if (newDean != null) {
                newDean.setDepartment(d);
                newDean.setRole(vn.edu.drl.backend.enu.Role.DEAN);
                userRepository.save(newDean);
            }
        }
        
        return getDepartmentResponse(d);
    }`;
svcContent = svcContent.replace(oldUpdate, newUpdate);

const oldCreate = `public DepartmentResponse create(DepartmentRequest req) {
        Department d = new Department();
        d.setDeptCode(req.getDeptCode());
        d.setDeptName(req.getDeptName());
        repository.save(d);
        return getDepartmentResponse(d);
    }`;
const newCreate = `public DepartmentResponse create(DepartmentRequest req) {
        Department d = new Department();
        d.setDeptCode(req.getDeptCode());
        d.setDeptName(req.getDeptName());
        if (req.getStatus() != null) {
            d.setStatus(req.getStatus());
        }
        repository.save(d);
        
        if (req.getDeanId() != null) {
            User newDean = userRepository.findById(req.getDeanId()).orElse(null);
            if (newDean != null) {
                newDean.setDepartment(d);
                newDean.setRole(vn.edu.drl.backend.enu.Role.DEAN);
                userRepository.save(newDean);
            }
        }
        
        return getDepartmentResponse(d);
    }`;
svcContent = svcContent.replace(oldCreate, newCreate);

fs.writeFileSync(svcPath, svcContent);
