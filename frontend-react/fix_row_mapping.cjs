const fs = require('fs');
let path = 'src/pages/admin/directory/DirectoryPage.jsx';
let content = fs.readFileSync(path, 'utf-8');

content = content.replace(
    'dean: item.deanName || "Chưa chỉ định",',
    'dean: item.deanName || "Chưa chỉ định",\n      deanId: item.deanId,'
);
fs.writeFileSync(path, content);
