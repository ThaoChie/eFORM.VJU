const fs = require('fs');

let jsx = fs.readFileSync('src/pages/admin/directory/DirectoryPage.jsx', 'utf-8');

// 1. Add classForm state
jsx = jsx.replace('const [form, setForm] = useState(false)', 'const [form, setForm] = useState(false)\n  const [classForm, setClassForm] = useState(null)\n  const [departments, setDepartments] = useState([])\n  const [students, setStudents] = useState([])');

// 2. Fetch departments and students
let fetchItemsCode = `    if (active === "departments") {
      import("../../../services/directory-service").then(({ directoryService }) => {
        directoryService.getDeans().then(res => {
          if (Array.isArray(res)) setDeans(res);
          else if (res && Array.isArray(res.data)) setDeans(res.data);
          else setDeans([]);
        }).catch(err => {
          console.error("Lỗi lấy danh sách trưởng khoa:", err);
          setDeans([]);
        });
      });
    }
    if (active === "classes") {
      import("../../../lib/axios/client").then(({ client }) => {
        client.get("/departments").then(res => setDepartments(res || []));
        client.get("/directory/users?role=STUDENT").then(res => setStudents(res || []));
      })
    }`;
jsx = jsx.replace(/if \(active === "departments"\) \{[\s\S]*?\}\n    \}/, fetchItemsCode);

// 3. Update active === "classes" columns
let classesColumnsCode = `if (active === "classes") {
    columns = [
      { key: "stt", title: "STT", render: (_, i) => i + 1 },
      { key: "code", title: "Mã lớp", render: (r) => <code className="font-mono">{r.code}</code> },
      { key: "name", title: "Tên lớp" },
      { key: "department", title: "Khoa", render: (r) => (
        <div className="leading-tight">
          <div className="font-medium">{r.deptName}</div>
          <div className="text-xs text-muted font-mono">{r.deptCode}</div>
        </div>
      )},
      { key: "dean", title: "Trưởng Khoa", render: (r) => r.deanName || "Chưa chỉ định" },
      { key: "leader", title: "Lớp trưởng", render: (r) => r.leaders?.length > 0 ? r.leaders.map(l => l.fullName).join(", ") : "Chưa chỉ định" },
      { key: "deputy", title: "Lớp phó", render: (r) => r.deputies?.length > 0 ? r.deputies.map(l => l.fullName).join(", ") : "Chưa có" },
      { key: "studentsCount", title: "Sĩ số", render: (r) => <span className="text-brand font-medium">{r.studentCount || 0}</span> },
      { key: "status", title: "Trạng thái", render: (r) => renderStatus(r.status === 1 ? "Đang hoạt động" : "Vô hiệu hóa") },
      { key: "action", title: "Thao tác", render: (r) => (
        <div className="flex">
          {r.status === 1 && (
            <IconButton label="Sửa" onClick={() => setClassForm({ 
              mode: 'edit', id: r.id, 
              deptId: r.deptId, classCode: r.code, className: r.name, 
              leaderIds: r.leaders?.map(l=>l.id) || [], 
              deputyIds: r.deputies?.map(l=>l.id) || [], 
              status: r.status 
            })}>
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
      code: item.classCode,
      name: item.className
    }));
  }`;

jsx = jsx.replace(/if \(active === "classes"\) \{[\s\S]*?\}\n  \} else if \(active === "users"\)/, classesColumnsCode + ' else if (active === "users")');

// 4. Update the "Thêm mới" button to use setClassForm
jsx = jsx.replace('<Button variant="primary" onClick={() => setForm({ mode: \'create\' })}>Thêm mới</Button>',
                  '{active === "classes" ? <Button variant="primary" onClick={() => setClassForm({ mode: \'create\', deptId: "", classCode: "", className: "", leaderIds: [], deputyIds: [], status: 1 })}>Thêm mới</Button> : <Button variant="primary" onClick={() => setForm({ mode: \'create\' })}>Thêm mới</Button>}');

fs.writeFileSync('src/pages/admin/directory/DirectoryPage.jsx', jsx);
