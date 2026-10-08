const fs = require('fs');

let path = '../backend-springboot/src/main/java/vn/edu/drl/backend/dto/response/DepartmentResponse.java';
let content = fs.readFileSync(path, 'utf-8');
if (!content.includes('private Long deanId')) {
    content = content.replace(
        'private String deanName;',
        'private String deanName;\n    private Long deanId;'
    );
    // Add it to constructor
    content = content.replace(
        'public DepartmentResponse(vn.edu.drl.backend.model.Department d, long classCount, long userCount, String deanName) {',
        'public DepartmentResponse(vn.edu.drl.backend.model.Department d, long classCount, long userCount, String deanName, Long deanId) {'
    );
    content = content.replace(
        'this.deanName = deanName;',
        'this.deanName = deanName;\n        this.deanId = deanId;'
    );
    fs.writeFileSync(path, content);
}

let svcPath = '../backend-springboot/src/main/java/vn/edu/drl/backend/service/impl/DepartmentServiceImpl.java';
let svcContent = fs.readFileSync(svcPath, 'utf-8');
const oldGet = `return new DepartmentResponse(d, classesCount, usersCount, deanName);`;
const newGet = `Long deanId = dean != null ? dean.getId() : null;\n            return new DepartmentResponse(d, classesCount, usersCount, deanName, deanId);`;
svcContent = svcContent.replace(oldGet, newGet);
fs.writeFileSync(svcPath, svcContent);

