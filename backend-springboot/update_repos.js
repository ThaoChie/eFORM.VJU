const fs = require('fs');

let classRepo = fs.readFileSync('src/main/java/vn/edu/drl/backend/dao/ClassRepository.java', 'utf-8');
classRepo = classRepo.replace('public interface ClassRepository extends JpaRepository<ClassEntity, Long> {', 'public interface ClassRepository extends JpaRepository<ClassEntity, Long> {\n    long countByDepartmentId(Long departmentId);');
fs.writeFileSync('src/main/java/vn/edu/drl/backend/dao/ClassRepository.java', classRepo);

let userRepo = fs.readFileSync('src/main/java/vn/edu/drl/backend/dao/UserRepository.java', 'utf-8');
userRepo = userRepo.replace('public interface UserRepository extends JpaRepository<User, Long> {', 'public interface UserRepository extends JpaRepository<User, Long> {\n    long countByDepartmentId(Long departmentId);\n    Optional<User> findFirstByDepartmentIdAndRole(Long departmentId, String role);');
fs.writeFileSync('src/main/java/vn/edu/drl/backend/dao/UserRepository.java', userRepo);

