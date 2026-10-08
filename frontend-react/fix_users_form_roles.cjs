const fs = require('fs');
let path = 'src/pages/admin/directory/DirectoryPage.jsx';
let content = fs.readFileSync(path, 'utf-8');

// Khoa condition
content = content.replace(
  '{["STUDENT", "DEAN"].includes(form.role) && (',
  '{["STUDENT", "DEAN", "CLASS_LEADER", "CLASS_DEPUTY"].includes(form.role) && ('
);

// Lớp condition
content = content.replace(
  '{form.role === "STUDENT" && (\\n              <Select label="Lớp"',
  '{["STUDENT", "CLASS_LEADER", "CLASS_DEPUTY"].includes(form.role) && (\\n              <Select label="Lớp"'
);

// Niên khóa condition
content = content.replace(
  '{form.role === "STUDENT" && (\\n              <Input label="Niên khóa"',
  '{["STUDENT", "CLASS_LEADER", "CLASS_DEPUTY"].includes(form.role) && (\\n              <Input label="Niên khóa"'
);

fs.writeFileSync(path, content);
