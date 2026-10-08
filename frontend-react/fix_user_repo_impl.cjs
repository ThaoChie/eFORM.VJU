const fs = require('fs');

// 1. Fix UserRepository
let repoPath = '../backend-springboot/src/main/java/vn/edu/drl/backend/dao/UserRepository.java';
let repo = fs.readFileSync(repoPath, 'utf-8');
if (!repo.includes('List<User> findByClassEntityId(Long classId);')) {
    repo = repo.replace(
        'long countByClassEntityId(Long classId);',
        'long countByClassEntityId(Long classId);\n    List<User> findByClassEntityId(Long classId);'
    );
    fs.writeFileSync(repoPath, repo);
}

// 2. Fix ClassServiceImpl
let implPath = '../backend-springboot/src/main/java/vn/edu/drl/backend/service/impl/ClassServiceImpl.java';
let impl = fs.readFileSync(implPath, 'utf-8');
impl = impl.replace(/UserEntity/g, 'User');
impl = impl.replace('vn.edu.drl.backend.entity.User', 'vn.edu.drl.backend.model.User');
fs.writeFileSync(implPath, impl);

