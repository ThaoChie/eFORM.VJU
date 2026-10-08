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
            <Select label="Khoa">
              <option>Tất cả Khoa (Mã - Tên)</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.deptCode} - {d.deptName}</option>)}
            </Select>
            <Input label="Mã lớp" placeholder="Nhập mã lớp" />
            <Input label="Tên lớp" placeholder="Nhập tên lớp" />
            <Input label="Niên khóa" placeholder="Ví dụ: K21" />
            <Select label="Trạng thái">
              <option>Tất cả</option>
              <option>Đang hoạt động</option>
              <option>Vô hiệu hóa</option>
            </Select>
            <div className="flex items-end gap-3 md:col-start-3 md:justify-end">
              <Button variant="ghost">Xóa bộ lọc</Button>
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

// Insert it right after renderToolbar ends
let idx = content.indexOf('const renderStatus');
if (idx !== -1) {
    content = content.substring(0, idx) + renderFiltersStr + "\n  " + content.substring(idx);
    fs.writeFileSync(path, content);
}
