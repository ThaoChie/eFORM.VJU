const fs = require('fs');
let path = '../backend-springboot/src/main/java/vn/edu/drl/backend/service/impl/UserServiceImpl.java';
let content = fs.readFileSync(path, 'utf-8');

const depsOld = `private final UserRepository repository;
    private final UserHibernateDao hibernateDao;
    
    public UserServiceImpl(UserRepository repository, UserHibernateDao hibernateDao) { 
        this.repository = repository; 
        this.hibernateDao = hibernateDao;
    }`;

const depsNew = `private final UserRepository repository;
    private final UserHibernateDao hibernateDao;
    private final vn.edu.drl.backend.dao.DepartmentRepository deptRepo;
    private final vn.edu.drl.backend.dao.ClassRepository classRepo;
    
    public UserServiceImpl(UserRepository repository, UserHibernateDao hibernateDao, vn.edu.drl.backend.dao.DepartmentRepository deptRepo, vn.edu.drl.backend.dao.ClassRepository classRepo) { 
        this.repository = repository; 
        this.hibernateDao = hibernateDao;
        this.deptRepo = deptRepo;
        this.classRepo = classRepo;
    }`;

content = content.replace(depsOld, depsNew);

// Now update the methods to use repo
const findDeptCode = 'vn.edu.drl.backend.model.Department d = hibernateDao.getDepartmentByCode(deptCode);';
const findDeptCodeNew = 'vn.edu.drl.backend.model.Department d = deptRepo.findByDeptCode(deptCode).orElse(null);';
content = content.replace(findDeptCode, findDeptCodeNew);

const findClassCode = 'vn.edu.drl.backend.model.ClassEntity c = hibernateDao.getClassByCode(classCode);';
const findClassCodeNew = 'vn.edu.drl.backend.model.ClassEntity c = classRepo.findByClassCode(classCode).orElse(null);';
content = content.replace(findClassCode, findClassCodeNew);

fs.writeFileSync(path, content);
