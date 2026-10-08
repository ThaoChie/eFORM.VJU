const fs = require('fs');
let path = 'src/pages/admin/directory/DirectoryPage.jsx';
let content = fs.readFileSync(path, 'utf-8');

let renderFiltersStr = `
  const renderFilters = () => {
    if (active === "departments" || active === "offices") {
      rows = rows.filter(r => {
    if (filters.status !== "Tất cả" && r.status !== filters.status) return false;
    if (filters.query) {
       const q = filters.query.toLowerCase();
       return r.code?.toLowerCase().includes(q) || r.name?.toLowerCase().includes(q) || r.fullName?.toLowerCase().includes(q);
    }
    return true;
  });

  return (
        <Card className="mb-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Input label="Mã - Tên" placeholder="Nhập mã hoặc tên" value={filters.query} onChange={(e) => setFilters({...filters, query: e.target.value})} />
            <Select label="Trạng thái" value={filters.status} onChange={(e) => setFilters({...filters, status: e.target.value})}>
              <option>Tất cả</option>
              <option>Đang hoạt động</option>
              <option>Vô hiệu hóa</option>
            </Select>
            <div className="flex items-end gap-3 md:col-start-3 md:justify-end">
              <Button variant="ghost" onClick={() => setFilters({query: "", status: "Tất cả"})}>Xóa bộ lọc</Button>
              <Button variant="primary">
                <Search className="size-4" /> Tìm kiếm
              </Button>
            </div>
          </div>
        </Card>
      );
    }
    
    if (active === "classes") {
      return (
        <Card className="mb-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Select label="Khoa" value={filters.dept} onChange={(e) => setFilters({...filters, dept: e.target.value})}>
              <option>Tất cả Khoa (Mã - Tên)</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.deptCode} - {d.deptName}</option>)}
            </Select>
            <Input label="Mã lớp" placeholder="Nhập mã lớp" value={filters.classCode} onChange={(e) => setFilters({...filters, classCode: e.target.value})} />
            <Input label="Tên lớp" placeholder="Nhập tên lớp" value={filters.className} onChange={(e) => setFilters({...filters, className: e.target.value})} />
            <Input label="Niên khóa" placeholder="Ví dụ: K21" value={filters.cohort} onChange={(e) => setFilters({...filters, cohort: e.target.value})} />
            <Select label="Trạng thái" value={filters.status} onChange={(e) => setFilters({...filters, status: e.target.value})}>
              <option>Tất cả</option>
              <option>Đang hoạt động</option>
              <option>Vô hiệu hóa</option>
            </Select>
            <div className="flex items-end gap-3 md:col-start-3 md:justify-end">
              <Button variant="ghost" onClick={() => setFilters({query: "", status: "Tất cả"})}>Xóa bộ lọc</Button>
              <Button variant="primary">
                <Search className="size-4" /> Tìm kiếm
              </Button>
            </div>
          </div>
        </Card>
      );
    }

    if (active === "users") {
      return (
        <Card className="mb-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Input label="Mã người dùng" placeholder="Nhập mã" />
            <Input label="Tên người dùng" placeholder="Nhập tên" />
            <Select label="Vai trò">
              <option>Tất cả</option>
              <option>Sinh viên</option>
              <option>Trưởng Khoa</option>
              <option>Admin</option>
            </Select>
            <Select label="Trạng thái">
              <option>Tất cả</option>
              <option>Đang hoạt động</option>
              <option>Vô hiệu hóa</option>
            </Select>
            <div className="md:col-span-2">
              <span className="text-sm font-medium text-brand cursor-pointer hover:underline">Bộ lọc nâng cao (2)</span>
            </div>
            <div className="flex items-end gap-3 md:justify-end">
              <Button variant="ghost">Xóa</Button>
              <Button variant="primary">
                <Search className="size-4" /> Tìm kiếm
              </Button>
            </div>
          </div>
        </Card>
      );
    }
    return null;
  }
`;

// Replace from the second renderToolbar up to `return (\n    <>`
let lines = content.split('\n');
let startIdx = -1;
let endIdx = -1;

let foundFirst = false;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('const renderToolbar = () => {')) {
    if (!foundFirst) {
      foundFirst = true;
    } else {
      startIdx = i;
    }
  }
  if (startIdx !== -1 && lines[i].trim() === 'return (' && lines[i+1] && lines[i+1].includes('<>')) {
    endIdx = i;
    break;
  }
}

if (startIdx !== -1 && endIdx !== -1) {
  let newLines = lines.slice(0, startIdx);
  newLines.push(renderFiltersStr);
  newLines = newLines.concat(lines.slice(endIdx));
  content = newLines.join('\n');
  fs.writeFileSync(path, content);
}
