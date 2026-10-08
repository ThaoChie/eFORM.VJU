const fs = require('fs');
let path = 'src/pages/admin/directory/DirectoryPage.jsx';
let content = fs.readFileSync(path, 'utf-8');

const oldBlock = `if (active === "departments" || active === "offices") {
      rows = rows.filter(r => {
        const itemStatus = (r.status === 1 || r.status === "Đang hoạt động") ? "Đang hoạt động" : "Vô hiệu hóa";
        if (filters.status !== "Tất cả" && itemStatus !== filters.status) return false;
        if (filters.query) {
           const q = filters.query.toLowerCase();
           return r.code?.toLowerCase().includes(q) || r.name?.toLowerCase().includes(q) || r.fullName?.toLowerCase().includes(q);
        }
        return true;
      });
      return (
        <Card className="mb-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Input label={active === "departments" ? "Mã - Tên Khoa" : "Mã - Tên Phòng ban"} placeholder="Nhập mã hoặc tên..." value={filters.query} onChange={(e) => setFilters({...filters, query: e.target.value})} />
            <div className="hidden md:block"></div>
            <div className="hidden md:block"></div>
            
            <Select label="Trạng thái" value={filters.status} onChange={(e) => setFilters({...filters, status: e.target.value})}>
              <option>Tất cả</option>
              <option>Đang hoạt động</option>
              <option>Vô hiệu hóa</option>
            </Select>
            <div className="hidden md:block"></div>
            
            <div className="flex items-end gap-3 md:justify-end">
              <Button variant="ghost" onClick={() => setFilters({query: "", status: "Tất cả"})}>Xóa bộ lọc</Button>
              <Button variant="primary"><Search className="size-4" /> Tìm kiếm</Button>
            </div>
          </div>
        </Card>
      );
    }`;

const newBlock = `if (active === "departments" || active === "offices") {
      rows = rows.filter(r => {
        const itemStatus = (r.status === 1 || r.status === "Đang hoạt động") ? "Đang hoạt động" : "Vô hiệu hóa";
        if (filters.status !== "Tất cả" && itemStatus !== filters.status) return false;
        if (filters.query) {
           const q = filters.query.toLowerCase();
           return r.code?.toLowerCase().includes(q) || r.name?.toLowerCase().includes(q) || r.fullName?.toLowerCase().includes(q);
        }
        return true;
      });
      return (
        <Card className="mb-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Input label={active === "departments" ? "Mã - Tên Khoa" : "Mã - Tên Phòng ban"} placeholder="Nhập mã hoặc tên..." value={filters.query} onChange={(e) => setFilters({...filters, query: e.target.value})} />
            
            <Select label="Trạng thái" value={filters.status} onChange={(e) => setFilters({...filters, status: e.target.value})}>
              <option>Tất cả</option>
              <option>Đang hoạt động</option>
              <option>Vô hiệu hóa</option>
            </Select>
            
            <div className="flex items-end gap-3 md:justify-end">
              <Button variant="ghost" onClick={() => setFilters({query: "", status: "Tất cả"})}>Xóa bộ lọc</Button>
              <Button variant="primary"><Search className="size-4" /> Tìm kiếm</Button>
            </div>
          </div>
        </Card>
      );
    }`;

content = content.replace(oldBlock, newBlock);
fs.writeFileSync(path, content);
