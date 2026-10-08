const fs = require('fs');
let path = 'src/main/java/vn/edu/drl/backend/service/impl/ClassServiceImpl.java';
let content = fs.readFileSync(path, 'utf-8');
content = content.replace('@Override\n    @Override', '@Override');
fs.writeFileSync(path, content);
