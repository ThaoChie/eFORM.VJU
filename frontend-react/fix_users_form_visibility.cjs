const fs = require('fs');
let path = 'src/pages/admin/directory/DirectoryPage.jsx';
let content = fs.readFileSync(path, 'utf-8');

// Update Khoa condition
content = content.replace(
  '{["STUDENT", "DEAN", "CLASS_LEADER", "CLASS_DEPUTY"].includes(form.role) && (\\n              <Select label="Khoa"',
  '{["STUDENT", "DEAN"].includes(form.role) && (\\n              <Select label="Khoa"'
);

// Update Lớp condition
content = content.replace(
  '{["STUDENT", "CLASS_LEADER", "CLASS_DEPUTY"].includes(form.role) && (\\n              <Select label="Lớp"',
  '{form.role === "STUDENT" && (\\n              <Select label="Lớp"'
);

// Update Niên khóa condition
content = content.replace(
  '{["STUDENT", "CLASS_LEADER", "CLASS_DEPUTY"].includes(form.role) && (\\n              <Input label="Niên khóa"',
  '{form.role === "STUDENT" && (\\n              <Input label="Niên khóa"'
);

// We might want to remove CLASS_LEADER and CLASS_DEPUTY from the Role select if that's what they mean.
// Actually, it doesn't hurt to have them, but let's change the conditions for them just in case.
// If the user selects CLASS_LEADER, what happens? They get no Khoa/Lop.
// I will just change the conditions to include CLASS_LEADER and CLASS_DEPUTY as well IF the user meant "Sinh viên" conceptually.
// But the prompt strictly said "chỉ hiển thị trường này với vai trò được chọn là sinh viên và trưởng khoa"
// Let's replace the whole Select role block to only have ADMIN, DEAN, STUDENT, as per the exact phrasing?
// Let's keep it safe and just strictly change the visibility conditions to exact matches.

content = content.replace(
  '{["STUDENT", "DEAN", "CLASS_LEADER", "CLASS_DEPUTY"].includes(form.role) && (',
  '{["STUDENT", "DEAN"].includes(form.role) && ('
);
content = content.replace(
  '{["STUDENT", "CLASS_LEADER", "CLASS_DEPUTY"].includes(form.role) && (',
  '{form.role === "STUDENT" && ('
);
content = content.replace(
  '{["STUDENT", "CLASS_LEADER", "CLASS_DEPUTY"].includes(form.role) && (',
  '{form.role === "STUDENT" && ('
);

fs.writeFileSync(path, content);
