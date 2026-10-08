const fs = require('fs');
let path = 'src/pages/admin/directory/DirectoryPage.jsx';
let content = fs.readFileSync(path, 'utf-8');
content = content.replace(/<Select label="Khoa \*" value=\{classForm\.deptId\} onChange=\{\(e\) => setClassForm\(\{\.\.\.classForm, deptId: e\.target\.value\}\)\} disabled=\{classForm\.mode === 'edit'\}>/, 
                          '<Select label="Khoa *" value={classForm.deptId} onChange={(e) => setClassForm({...classForm, deptId: e.target.value})}>');
fs.writeFileSync(path, content);
