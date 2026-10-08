const fs = require('fs');
let path = 'src/main/java/vn/edu/drl/backend/controller/ClassController.java';
let content = fs.readFileSync(path, 'utf-8');
content = content.replace(/@PostMapping\("\/import"\)\n\s+@GetMapping\("\/template-excel"\)/, '@GetMapping("/template-excel")');
fs.writeFileSync(path, content);
