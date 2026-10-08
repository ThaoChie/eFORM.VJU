const fs = require('fs');

let repoPath = 'src/main/java/vn/edu/drl/backend/dao/UserRepository.java';
let repoContent = fs.readFileSync(repoPath, 'utf-8');

if (!repoContent.includes('findByClassEntityIdAndRole')) {
    repoContent = repoContent.replace('}', `
    java.util.List<vn.edu.drl.backend.model.User> findByClassEntityIdAndRole(Long classId, vn.edu.drl.backend.enu.Role role);
    java.util.List<vn.edu.drl.backend.model.User> findByRole(vn.edu.drl.backend.enu.Role role);
    java.util.List<vn.edu.drl.backend.model.User> findByClassEntityId(Long classId);
    long countByClassEntityId(Long classId);
}
`);
    fs.writeFileSync(repoPath, repoContent);
}
