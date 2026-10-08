const fs = require('fs');
let path = 'src/components/ui/AppLayout.jsx';
let content = fs.readFileSync(path, 'utf-8');

content = content.replace('E-Form Điểm', 'E-Form Chấm Điểm');
fs.writeFileSync(path, content);
