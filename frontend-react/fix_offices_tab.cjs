const fs = require('fs');
let path = 'src/pages/admin/directory/DirectoryPage.jsx';
let content = fs.readFileSync(path, 'utf-8');

// 1. Add columns for active === "offices"
const officesColumnsCode = `} else if (active === "offices") {
    columns = [
      { key: "stt", title: "STT", render: (_, i) => i + 1 },
      { key: "code", title: "Mã phòng ban", render: (r) => <code className="font-mono">{r.code}</code> },
      { key: "name", title: "Tên phòng ban" },
      { key: "head", title: "Trưởng phòng", render: (r) => r.headName || "Chưa chỉ định" },
      { key: "status", title: "Trạng thái", render: (r) => renderStatus(r.status === 1 ? "Đang hoạt động" : "Vô hiệu hóa") },
      { key: "action", title: "Thao tác", render: (r) => (
        <div className="flex">
          {r.status === 1 && (
            <IconButton label="Sửa" onClick={() => setForm({ mode: 'edit', ...r })}>
              <Pencil className="size-4" />
            </IconButton>
          )}
          {r.status === 1 ? (
            <IconButton label="Vô hiệu hóa" onClick={async () => {
              try { const { client } = await import("../../../lib/axios/client"); await client.put(\`/\${active}/\${r.id}/toggle-status\`); fetchItems(active); } 
              catch (e) { toast.error(e.response?.data?.message || "Không thể vô hiệu hóa"); }
            }}>
              <CircleOff className="size-4" />
            </IconButton>
          ) : (
            <IconButton label="Kích hoạt" onClick={async () => {
              try { const { client } = await import("../../../lib/axios/client"); await client.put(\`/\${active}/\${r.id}/toggle-status\`); fetchItems(active); } 
              catch (e) { toast.error("Lỗi kích hoạt"); }
            }}>
              <CheckCircle className="size-4 text-green-500" />
            </IconButton>
          )}
        </div>
      )}
    ];
    rows = items.map(item => ({
      ...item,
      code: item.officeCode || item.code || "",
      name: item.officeName || item.name || "",
      headName: item.headName || "Chưa chỉ định",
      status: item.status
    }));
  }`;

content = content.replace(
  'email: item.email || "",\n      role: item.role || "Sinh viên",\n      status: item.status\n    }));\n  }',
  'email: item.email || "",\n      role: item.role || "Sinh viên",\n      status: item.status\n    }));\n  ' + officesColumnsCode
);

// 2. Separate departments and offices filters to ensure they look similar to Lớp (grid-cols-3 layout)
const oldDeptFilter = `if (active === "departments" || active === "offices") {
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
              <Button variant="primary"><Search className="size-4" /> Tìm kiếm</Button>
            </div>
          </div>
        </Card>
      );
    }`;

const newDeptAndOfficeFilter = `if (active === "departments" || active === "offices") {
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

content = content.replace(oldDeptFilter, newDeptAndOfficeFilter);

// 3. Update renderToolbar to include offices
content = content.replace(
  'if (active === "classes" || active === "departments" || active === "users") {',
  'if (active === "classes" || active === "departments" || active === "users" || active === "offices") {'
);

fs.writeFileSync(path, content);
