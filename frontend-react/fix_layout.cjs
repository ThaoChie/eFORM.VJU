const fs = require('fs');
let path = 'src/pages/admin/directory/DirectoryPage.jsx';
let content = fs.readFileSync(path, 'utf-8');

// The original grid for classes:
/*
          <div className="grid gap-4 md:grid-cols-3">
            <Select label="Khoa" value={filters.dept} onChange={(e) => setFilters({...filters, dept: e.target.value})}>
              <option value="">Tất cả Khoa (Mã - Tên)</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.deptCode} - {d.deptName}</option>)}
            </Select>
            <Input label="Mã - Tên lớp" placeholder="Nhập mã hoặc tên lớp" value={filters.query} onChange={(e) => setFilters({...filters, query: e.target.value})} />
            <Input label="Niên khóa" placeholder="Ví dụ: K21" value={filters.cohort} onChange={(e) => setFilters({...filters, cohort: e.target.value})} />
            <Select label="Trạng thái" value={filters.status} onChange={(e) => setFilters({...filters, status: e.target.value})}>
              <option>Tất cả</option>
              <option>Đang hoạt động</option>
              <option>Vô hiệu hóa</option>
            </Select>
            <div className="flex items-end gap-3 md:col-start-3 md:justify-end">
              <Button variant="ghost" onClick={() => setFilters({query: "", status: "Tất cả", dept: "", cohort: ""})}>Xóa bộ lọc</Button>
              <Button variant="primary"><Search className="size-4" /> Tìm kiếm</Button>
            </div>
          </div>
*/

const oldBlock = `<div className="grid gap-4 md:grid-cols-3">
            <Select label="Khoa" value={filters.dept} onChange={(e) => setFilters({...filters, dept: e.target.value})}>
              <option value="">Tất cả Khoa (Mã - Tên)</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.deptCode} - {d.deptName}</option>)}
            </Select>
            <Input label="Mã - Tên lớp" placeholder="Nhập mã hoặc tên lớp" value={filters.query} onChange={(e) => setFilters({...filters, query: e.target.value})} />
            <Input label="Niên khóa" placeholder="Ví dụ: K21" value={filters.cohort} onChange={(e) => setFilters({...filters, cohort: e.target.value})} />
            <Select label="Trạng thái" value={filters.status} onChange={(e) => setFilters({...filters, status: e.target.value})}>
              <option>Tất cả</option>
              <option>Đang hoạt động</option>
              <option>Vô hiệu hóa</option>
            </Select>
            <div className="flex items-end gap-3 md:col-start-3 md:justify-end">
              <Button variant="ghost" onClick={() => setFilters({query: "", status: "Tất cả", dept: "", cohort: ""})}>Xóa bộ lọc</Button>
              <Button variant="primary"><Search className="size-4" /> Tìm kiếm</Button>
            </div>
          </div>`;

const newBlock = `<div className="grid gap-4 md:grid-cols-3">
            <Select label="Khoa" value={filters.dept} onChange={(e) => setFilters({...filters, dept: e.target.value})}>
              <option value="">Tất cả Khoa (Mã - Tên)</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.deptCode} - {d.deptName}</option>)}
            </Select>
            <Input label="Mã - Tên lớp" placeholder="Nhập mã hoặc tên lớp" value={filters.query} onChange={(e) => setFilters({...filters, query: e.target.value})} />
            <div className="hidden md:block"></div>
            
            <Select label="Trạng thái" value={filters.status} onChange={(e) => setFilters({...filters, status: e.target.value})}>
              <option>Tất cả</option>
              <option>Đang hoạt động</option>
              <option>Vô hiệu hóa</option>
            </Select>
            <Input label="Niên khóa" placeholder="Ví dụ: K21" value={filters.cohort} onChange={(e) => setFilters({...filters, cohort: e.target.value})} />
            
            <div className="flex items-end gap-3 md:justify-end">
              <Button variant="ghost" onClick={() => setFilters({query: "", status: "Tất cả", dept: "", cohort: ""})}>Xóa bộ lọc</Button>
              <Button variant="primary"><Search className="size-4" /> Tìm kiếm</Button>
            </div>
          </div>`;

content = content.replace(oldBlock, newBlock);
fs.writeFileSync(path, content);
