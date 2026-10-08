const fs = require('fs');
let repo = fs.readFileSync('src/main/java/vn/edu/drl/backend/dao/DepartmentRepository.java', 'utf-8');
repo = repo.replace('public interface DepartmentRepository extends JpaRepository<Department, Long> {', 'public interface DepartmentRepository extends JpaRepository<Department, Long> {\n    java.util.Optional<Department> findByDeptCode(String code);');
fs.writeFileSync('src/main/java/vn/edu/drl/backend/dao/DepartmentRepository.java', repo);
