const fs = require('fs');
let path = 'src/pages/admin/directory/DirectoryPage.jsx';
let content = fs.readFileSync(path, 'utf-8');

const oldBlock = `<Select label="Vai trò" value={filters.role} onChange={(e) => setFilters({...filters, role: e.target.value})}>
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
            
            <div className="flex items-end gap-3 md:justify-end">`;

const newBlock = `<Select label="Vai trò" value={filters.role} onChange={(e) => setFilters({...filters, role: e.target.value})}>
              <option value="">Tất cả vai trò</option>
              <option value="ADMIN">Quản trị viên</option>
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
            <Input label="Khoa" placeholder="Tìm tên hoặc mã khoa..." value={filters.deptSearch || ""} onChange={(e) => setFilters({...filters, deptSearch: e.target.value})} />
            
            <div className="flex items-end gap-3 md:justify-end">`;

content = content.replace(oldBlock, newBlock);
fs.writeFileSync(path, content);
