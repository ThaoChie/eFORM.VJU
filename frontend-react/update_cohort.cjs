const fs = require('fs');

// 1 & 2. DirectoryPage.jsx
let path = 'src/pages/admin/directory/DirectoryPage.jsx';
let content = fs.readFileSync(path, 'utf-8');

// Update columns for classes to include Niên khóa
content = content.replace(
  '{ key: "department", title: "Khoa"',
  '{ key: "academicCohort", title: "Niên khóa" },\n      { key: "department", title: "Khoa"'
);

// Update rows mapping to include academicCohort and deptId
content = content.replace(
  'name: item.className\n    }));',
  'name: item.className,\n      academicCohort: item.academicCohort,\n      deptId: item.deptId\n    }));'
);

// Update renderFilters for classes
content = content.replace(
  'if (filters.query) {',
  'if (filters.dept && r.deptId !== Number(filters.dept)) return false;\n        if (filters.cohort && r.academicCohort && !r.academicCohort.toLowerCase().includes(filters.cohort.toLowerCase())) return false;\n        if (filters.query) {'
);

// Update renderToolbar Thêm mới button for classes
content = content.replace(
  'setClassForm({ mode: \'create\', deptId: "", classCode: "", className: "", leaderIds: [], deputyIds: [], status: 1 })',
  'setClassForm({ mode: \'create\', deptId: "", classCode: "", className: "", academicCohort: "", leaderIds: [], deputyIds: [], status: 1 })'
);

// Update actionButtons (edit) for classes
content = content.replace(
  'className: r.name, leaderIds:',
  'className: r.name, academicCohort: r.academicCohort || "", leaderIds:'
);

// Update Modal for classes
content = content.replace(
  '<Input label="Tên lớp *" value={classForm.className} onChange={(e) => setClassForm({...classForm, className: e.target.value})} />',
  '<Input label="Tên lớp *" value={classForm.className} onChange={(e) => setClassForm({...classForm, className: e.target.value})} />\n              <Input label="Niên khóa" placeholder="Nhập niên khóa (Ví dụ: K21)" value={classForm.academicCohort || ""} onChange={(e) => setClassForm({...classForm, academicCohort: e.target.value})} />'
);

fs.writeFileSync(path, content);

// 3. AppLayout.jsx
path = 'src/components/ui/AppLayout.jsx';
content = fs.readFileSync(path, 'utf-8');

const originalLogo = `<span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand text-lg font-bold text-white shadow-md">
            ĐRL
          </span>
          <span className="min-w-0 font-semibold leading-5">
            E-Form Điểm
            <br />
            Rèn Luyện
          </span>`;

const newLogo = `<img src="/logoVJU.png" alt="VJU Logo" className="h-10 object-contain" />`;

if (content.includes('ĐRL')) {
  content = content.replace(originalLogo, newLogo);
  fs.writeFileSync(path, content);
}
