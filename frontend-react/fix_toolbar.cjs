const fs = require('fs');
let jsx = fs.readFileSync('src/pages/admin/directory/DirectoryPage.jsx', 'utf-8');

let newToolbar = `    if (active === "classes" || active === "departments") {
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
    }`;

jsx = jsx.replace(/if \(active === "departments"\) \{[\s\S]*?if \(active === "users"\)/, newToolbar + '\n    \n    if (active === "users")');

fs.writeFileSync('src/pages/admin/directory/DirectoryPage.jsx', jsx);
