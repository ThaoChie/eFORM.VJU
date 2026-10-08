const fs = require('fs');
let path = 'src/pages/admin/directory/DirectoryPage.jsx';
let content = fs.readFileSync(path, 'utf-8');

// 1. Add states for offices and classes
content = content.replace(
  'const [students, setStudents] = useState([]);',
  'const [students, setStudents] = useState([]);\n  const [offices, setOffices] = useState([]);\n  const [classes, setClasses] = useState([]);'
);

// 2. Fetch offices and classes in useEffect for "users"
const fetchUsersCode = `if (active === "users") {
      import("../../../lib/axios/client").then(({ client }) => {
        client.get("/departments").then(res => setDepartments(res || []));
        client.get("/offices").then(res => setOffices(res || []));
        client.get("/classes").then(res => setClasses(res || []));
      });
    }`;
content = content.replace(
  'if (active === "classes") {',
  fetchUsersCode + '\n    if (active === "classes") {'
);

// 3. Add department logic to user rows and update User columns to show department
const userRowsCode = `rows = items.map(item => ({
      ...item,
      userCode: item.userCode || item.code,
      fullName: item.fullName || item.name,
      email: item.email || "",
      role: item.role || "Sinh viên",
      status: item.status,
      deptName: item.department ? item.department.deptName : "",
      deptCode: item.department ? item.department.deptCode : "",
      officeName: item.office ? item.office.officeName : "",
      officeCode: item.office ? item.office.officeCode : "",
      className: item.classEntity ? item.classEntity.className : "",
      classCode: item.classEntity ? item.classEntity.classCode : "",
      academicCohort: item.academicCohort || (item.classEntity ? item.classEntity.academicCohort : "")
    }));`;
content = content.replace(
  /rows = items\.map\(item => \(\{\s*\.\.\.item,\s*userCode:[\s\S]*?status: item\.status\s*\}\)\);/,
  userRowsCode
);

// update columns for users
content = content.replace(
  '{ key: "email", title: "Email" },',
  '{ key: "email", title: "Email" },\n      { key: "department", title: "Khoa/Phòng", render: (r) => r.deptName || r.officeName || "Không có" },'
);

// 4. Update Users filter to include Khoa input
const usersFilterOld = `if (active === "users") {
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

const usersFilterNew = `if (active === "users") {
      rows = rows.filter(r => {
        if (filters.status !== "Tất cả" && (r.status === 1 ? "Đang hoạt động" : "Vô hiệu hóa") !== filters.status) return false;
        if (filters.role && r.role !== filters.role) return false;
        if (filters.query) {
           const q = filters.query.toLowerCase();
           return r.userCode?.toLowerCase().includes(q) || r.fullName?.toLowerCase().includes(q) || r.email?.toLowerCase().includes(q);
        }
        if (filters.deptSearch) {
           const dq = filters.deptSearch.toLowerCase();
           return r.deptCode?.toLowerCase().includes(dq) || r.deptName?.toLowerCase().includes(dq);
        }
        return true;
      });
      return (
        <Card className="mb-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Select label="Vai trò" value={filters.role} onChange={(e) => setFilters({...filters, role: e.target.value})}>
              <option value="">Tất cả vai trò</option>
              <option value="ADMIN">Quản trị viên</option>
              <option value="STUDENT">Sinh viên</option>
              <option value="CLASS_LEADER">Lớp trưởng</option>
              <option value="CLASS_DEPUTY">Lớp phó</option>
              <option value="DEAN">Trưởng khoa</option>
            </Select>
            <Input label="Mã - Tên - Email" placeholder="Nhập mã, tên hoặc email..." value={filters.query} onChange={(e) => setFilters({...filters, query: e.target.value})} />
            <Input label="Khoa" placeholder="Tìm tên hoặc mã khoa..." value={filters.deptSearch || ""} onChange={(e) => setFilters({...filters, deptSearch: e.target.value})} />
            
            <Select label="Trạng thái" value={filters.status} onChange={(e) => setFilters({...filters, status: e.target.value})}>
              <option>Tất cả</option>
              <option>Đang hoạt động</option>
              <option>Vô hiệu hóa</option>
            </Select>
            <div className="hidden md:block"></div>
            
            <div className="flex items-end gap-3 md:justify-end">
              <Button variant="ghost" onClick={() => setFilters({query: "", status: "Tất cả", role: "", deptSearch: ""})}>Xóa bộ lọc</Button>
              <Button variant="primary"><Search className="size-4" /> Tìm kiếm</Button>
            </div>
          </div>
        </Card>
      );
    }`;
content = content.replace(usersFilterOld, usersFilterNew);

fs.writeFileSync(path, content);
