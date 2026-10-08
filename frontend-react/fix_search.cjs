const fs = require('fs');

let jsx = fs.readFileSync('src/pages/admin/directory/DirectoryPage.jsx', 'utf-8');

// 1. Add state
jsx = jsx.replace('const [blocked, setBlocked] = useState(null);', 'const [blocked, setBlocked] = useState(null);\n  const [filters, setFilters] = useState({ query: "", status: "Tất cả" });');

// 2. Add onChange and onClick to Departments Filter
let oldDeptFilter = `<Input label="Mã - Tên" placeholder="Nhập mã hoặc tên" />
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
            </div>`;

let newDeptFilter = `<Input label="Mã - Tên" placeholder="Nhập mã hoặc tên" value={filters.query} onChange={(e) => setFilters({...filters, query: e.target.value})} />
            <Select label="Trạng thái" value={filters.status} onChange={(e) => setFilters({...filters, status: e.target.value})}>
              <option>Tất cả</option>
              <option>Đang hoạt động</option>
              <option>Vô hiệu hóa</option>
            </Select>
            <div className="flex items-end gap-3 md:col-start-3 md:justify-end">
              <Button variant="ghost" onClick={() => setFilters({query: "", status: "Tất cả"})}>Xóa bộ lọc</Button>
              {/* Tìm kiếm hiện đang là auto-filter (client-side) nên nút Tìm kiếm chỉ để trưng bày hoặc submit filter nếu server-side */}
              <Button variant="primary">
                <Search className="size-4" /> Tìm kiếm
              </Button>
            </div>`;

jsx = jsx.replace(oldDeptFilter, newDeptFilter);

// 3. Filter the rows
let oldTable = `<Table
            columns={columns.filter(c => visibleCols.includes(c.key))}
            data={rows}
          />`;
let newTable = `          <Table
            columns={columns.filter(c => visibleCols.includes(c.key))}
            data={rows.filter(r => {
              if (filters.status !== "Tất cả" && r.status !== filters.status) return false;
              if (filters.query) {
                 const q = filters.query.toLowerCase();
                 return r.code?.toLowerCase().includes(q) || r.name?.toLowerCase().includes(q) || r.fullName?.toLowerCase().includes(q);
              }
              return true;
            })}
          />`;

jsx = jsx.replace(oldTable, newTable);

fs.writeFileSync('src/pages/admin/directory/DirectoryPage.jsx', jsx);
