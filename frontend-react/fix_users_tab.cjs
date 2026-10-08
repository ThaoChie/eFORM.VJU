const fs = require('fs');
let path = 'src/pages/admin/directory/DirectoryPage.jsx';
let content = fs.readFileSync(path, 'utf-8');

// 1. Add columns and rows for active === "users"
const usersColumnsCode = `} else if (active === "users") {
    columns = [
      { key: "stt", title: "STT", render: (_, i) => i + 1 },
      { key: "userCode", title: "Mã người dùng", render: (r) => <code className="font-mono">{r.userCode}</code> },
      { key: "fullName", title: "Họ và tên" },
      { key: "email", title: "Email" },
      { key: "role", title: "Vai trò" },
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
      userCode: item.userCode || item.code,
      fullName: item.fullName || item.name,
      email: item.email || "",
      role: item.role || "Sinh viên",
      status: item.status
    }));
  }`;

content = content.replace(
  'name: item.className,\n      academicCohort: item.academicCohort,\n      deptId: item.deptId\n    }));\n  }',
  'name: item.className,\n      academicCohort: item.academicCohort,\n      deptId: item.deptId\n    }));\n  ' + usersColumnsCode
);

// 2. Add filters for active === "users"
const usersFilterCode = `if (active === "users") {
      rows = rows.filter(r => {
        if (filters.status !== "Tất cả" && (r.status === 1 ? "Đang hoạt động" : "Vô hiệu hóa") !== filters.status) return false;
        if (filters.query) {
           const q = filters.query.toLowerCase();
           return r.userCode?.toLowerCase().includes(q) || r.fullName?.toLowerCase().includes(q) || r.email?.toLowerCase().includes(q);
        }
        return true;
      });
      return (
        <Card className="mb-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Select label="Vai trò" value={filters.role} onChange={(e) => setFilters({...filters, role: e.target.value})}>
              <option value="">Tất cả vai trò</option>
              <option value="STUDENT">Sinh viên</option>
              <option value="CLASS_LEADER">Lớp trưởng</option>
              <option value="CLASS_DEPUTY">Lớp phó</option>
              <option value="DEAN">Trưởng khoa</option>
            </Select>
            <Input label="Mã - Tên - Email" placeholder="Nhập mã, tên hoặc email..." value={filters.query} onChange={(e) => setFilters({...filters, query: e.target.value})} />
            <div className="hidden md:block"></div>
            
            <Select label="Trạng thái" value={filters.status} onChange={(e) => setFilters({...filters, status: e.target.value})}>
              <option>Tất cả</option>
              <option>Đang hoạt động</option>
              <option>Vô hiệu hóa</option>
            </Select>
            <div className="hidden md:block"></div>
            
            <div className="flex items-end gap-3 md:justify-end">
              <Button variant="ghost" onClick={() => setFilters({query: "", status: "Tất cả", role: ""})}>Xóa bộ lọc</Button>
              <Button variant="primary"><Search className="size-4" /> Tìm kiếm</Button>
            </div>
          </div>
        </Card>
      );
    }`;

content = content.replace(
  'return null;\n  };',
  usersFilterCode + '\n    return null;\n  };'
);

// 3. Add to renderToolbar
content = content.replace(
  'if (active === "classes" || active === "departments") {',
  'if (active === "classes" || active === "departments" || active === "users") {'
);

fs.writeFileSync(path, content);
