const fs = require('fs');
let repoPath = 'src/main/java/vn/edu/drl/backend/dao/UserRepository.java';
let content = fs.readFileSync(repoPath, 'utf-8');
if (!content.includes('countByClassEntityId')) {
    content = content.replace('}', '    long countByClassEntityId(Long classId);\n}');
    fs.writeFileSync(repoPath, content);
}

let svcPath = 'src/main/java/vn/edu/drl/backend/service/impl/ClassServiceImpl.java';
let svc = fs.readFileSync(svcPath, 'utf-8');
svc = svc.replace('User dean = userRepo.findFirstByDepartmentIdAndRole(c.getDepartment().getId(), Role.DEAN);', 
                  'User dean = userRepo.findFirstByDepartmentIdAndRole(c.getDepartment().getId(), Role.DEAN).orElse(null);');
fs.writeFileSync(svcPath, svc);
