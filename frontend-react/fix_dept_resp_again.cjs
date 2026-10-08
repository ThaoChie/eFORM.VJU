const fs = require('fs');

let path = '../backend-springboot/src/main/java/vn/edu/drl/backend/dto/response/DepartmentResponse.java';
let content = fs.readFileSync(path, 'utf-8');

content = content.replace(
    'public DepartmentResponse(Department d, long classesCount, long usersCount, String deanName) {',
    'public DepartmentResponse(Department d, long classesCount, long usersCount, String deanName, Long deanId) {'
);
fs.writeFileSync(path, content);
