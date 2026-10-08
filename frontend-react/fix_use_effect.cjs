const fs = require('fs');
let path = 'src/pages/admin/directory/DirectoryPage.jsx';
let content = fs.readFileSync(path, 'utf-8');

// The original useEffect looks like this now:
// useEffect(() => {
//   fetchItems(active);
//           if (active === "classes" || active === "departments") { ... }
//   if (active === "users") { ... }
//   return null;
// }

// Let's replace the whole block from useEffect to the end of the broken renderToolbar with the correct structure.

let fix = `
  useEffect(() => {
    fetchItems(active);
    if (active === "departments") {
      import("../../../services/directory-service").then(({ directoryService }) => {
        directoryService.getDeans().then(res => {
          if (Array.isArray(res)) setDeans(res);
          else if (res && Array.isArray(res.data)) setDeans(res.data);
          else setDeans([]);
        }).catch(err => setDeans([]));
      });
    }
    if (active === "classes") {
      import("../../../lib/axios/client").then(({ client }) => {
        client.get("/departments").then(res => setDepartments(res || []));
        client.get("/directory/users?role=STUDENT").then(res => setStudents(res || []));
      })
    }
  }, [active, fetchItems])

  const renderToolbar = () => {
    if (active === "classes" || active === "departments") {
      return (
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setColConfig(true)}>
            <Settings className="size-4" /> Cấu hình cột
          </Button>
          <Button onClick={() => window.open(active === "classes" ? "http://localhost:8080/api/v1/classes/template-excel" : "http://localhost:8080/api/v1/directory/users/template-excel", "_blank")}>
            <Download className="size-4" /> Tải file mẫu
          </Button>
          <Button onClick={() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.xlsx, .xls';
            input.onchange = (e) => {
              if (e.target.files.length > 0) {
                 setSelectedFile(e.target.files[0]);
                 setImportExcel(true);
              }
            };
            input.click();
          }}>
            <Upload className="size-4" /> Nhập từ Excel
          </Button>
          {active === "classes" ? <Button variant="primary" onClick={() => setClassForm({ mode: 'create', deptId: "", classCode: "", className: "", leaderIds: [], deputyIds: [], status: 1 })}>
            <Plus className="size-4" /> Thêm mới
          </Button> : <Button variant="primary" onClick={() => setForm({ mode: 'create' })}>
            <Plus className="size-4" /> Thêm mới
          </Button>}
        </div>
      );
    }
    if (active === "users") {
      return (
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setColConfig(true)}>
            <Settings className="size-4" /> Cấu hình cột
          </Button>
          <Button>
            <Download className="size-4" /> Xuất Excel
          </Button>
          <Button onClick={() => window.open("http://localhost:8080/api/v1/directory/users/template-excel", "_blank")}>
            <Download className="size-4" /> Tải file mẫu
          </Button>
          <Button onClick={() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.xlsx, .xls';
            input.onchange = (e) => {
              if (e.target.files.length > 0) {
                 setImportExcel(true);
              }
            };
            input.click();
          }}>
            <Upload className="size-4" /> Nhập từ Excel
          </Button>
          <Button variant="primary" onClick={() => nav("/admin/directory/users/new")}>
            <Plus className="size-4" /> Thêm mới
          </Button>
        </div>
      );
    }
    return (
      <Button variant="primary" onClick={() => setForm({ mode: 'create' })}>
        <Plus className="size-4" /> Thêm mới
      </Button>
    )
  }
`;

content = content.replace(/useEffect\(\(\) => \{[\s\S]*?return null;\n  \}/, fix.trim());

fs.writeFileSync(path, content);
