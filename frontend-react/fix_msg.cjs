const fs = require('fs');

let srv = fs.readFileSync('../backend-springboot/src/main/java/vn/edu/drl/backend/service/impl/DepartmentServiceImpl.java', 'utf-8');

let newLogic = `    public Department toggleStatus(Long id) {
        Department d = repository.findById(id).orElseThrow(() -> new RuntimeException("Not found"));
        if (d.getStatus() == 1) {
            long classesCount = classRepository.countByDepartmentId(d.getId());
            long usersCount = userRepository.countByDepartmentId(d.getId());
            if (classesCount > 0 || usersCount > 0) {
                throw new vn.edu.drl.backend.exception.BusinessException("Không thể vô hiệu vì đang có Lớp hoặc người dùng thuộc khoa này.");
            }
        }
        d.setStatus(d.getStatus() == 1 ? 0 : 1);
        return repository.save(d);
    }`;

srv = srv.replace(/public Department toggleStatus[\s\S]*?\}\n    \}/, newLogic + '\n    }');
fs.writeFileSync('../backend-springboot/src/main/java/vn/edu/drl/backend/service/impl/DepartmentServiceImpl.java', srv);
