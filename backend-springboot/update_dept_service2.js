const fs = require('fs');

let implContent = fs.readFileSync('src/main/java/vn/edu/drl/backend/service/impl/DepartmentServiceImpl.java', 'utf-8');

implContent = implContent.replace('import java.util.List;', 'import java.util.List;\nimport vn.edu.drl.backend.dto.response.DepartmentResponse;\nimport vn.edu.drl.backend.dao.ClassRepository;\nimport vn.edu.drl.backend.dao.UserRepository;\nimport vn.edu.drl.backend.model.User;\nimport java.util.stream.Collectors;');
implContent = implContent.replace('List<Department> findAll();', 'List<DepartmentResponse> findAll();');

let constructor = `    private final DepartmentRepository repository;
    private final ClassRepository classRepository;
    private final UserRepository userRepository;
    
    public DepartmentServiceImpl(DepartmentRepository repository, ClassRepository classRepository, UserRepository userRepository) { 
        this.repository = repository; 
        this.classRepository = classRepository;
        this.userRepository = userRepository;
    }`;

implContent = implContent.replace(/private final DepartmentRepository repository;[\s\S]*?this.repository = repository; }/, constructor);

let findAllMethod = `    public List<DepartmentResponse> findAll() {
        return repository.findAll().stream().map(d -> {
            long classesCount = classRepository.countByDepartmentId(d.getId());
            long usersCount = userRepository.countByDepartmentId(d.getId());
            String deanName = "Chưa chỉ định";
            User dean = userRepository.findFirstByDepartmentIdAndRole(d.getId(), "DEAN").orElse(null);
            if (dean != null) deanName = dean.getFullName();
            return new DepartmentResponse(d, classesCount, usersCount, deanName);
        }).collect(Collectors.toList());
    }`;

implContent = implContent.replace('public List<Department> findAll() { return repository.findAll(); }', findAllMethod);

fs.writeFileSync('src/main/java/vn/edu/drl/backend/service/impl/DepartmentServiceImpl.java', implContent);

let interfaceContent = fs.readFileSync('src/main/java/vn/edu/drl/backend/service/DepartmentService.java', 'utf-8');
interfaceContent = interfaceContent.replace('List<Department> findAll();', 'List<vn.edu.drl.backend.dto.response.DepartmentResponse> findAll();');
fs.writeFileSync('src/main/java/vn/edu/drl/backend/service/DepartmentService.java', interfaceContent);
