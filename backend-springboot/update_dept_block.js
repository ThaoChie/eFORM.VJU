const fs = require('fs');

// 1. Update Backend
let srv = fs.readFileSync('src/main/java/vn/edu/drl/backend/service/impl/DepartmentServiceImpl.java', 'utf-8');
let toggle = `    public Department toggleStatus(Long id) {
        Department d = repository.findById(id).orElseThrow(() -> new RuntimeException("Not found"));
        if (d.getStatus() == 1) {
            long classesCount = classRepository.countByDepartmentId(d.getId());
            if (classesCount > 0) {
                throw new RuntimeException("Còn " + classesCount + " lớp trực thuộc đang hoạt động, hãy vô hiệu hóa lớp trước");
            }
            long usersCount = userRepository.countByDepartmentId(d.getId());
            if (usersCount > 0) {
                throw new RuntimeException("Còn " + usersCount + " người dùng trực thuộc đang hoạt động");
            }
        }
        d.setStatus(d.getStatus() == 1 ? 0 : 1);
        return repository.save(d);
    }
}`;
srv = srv.replace(/public Department toggleStatus[\s\S]*?}\n}/, toggle);
fs.writeFileSync('src/main/java/vn/edu/drl/backend/service/impl/DepartmentServiceImpl.java', srv);

// 2. Update Frontend
let jsx = fs.readFileSync('../frontend-react/src/pages/admin/directory/DirectoryPage.jsx', 'utf-8');

// Change blocked state from boolean to string
jsx = jsx.replace('const [blocked, setBlocked] = useState(false)', 'const [blocked, setBlocked] = useState(null)');

// Change catch block
jsx = jsx.replace(/} catch \(e\) \{\n              setBlocked\(true\);\n            \}/g, `} catch (e) {
              setBlocked(e.response?.data?.message || "Không thể vô hiệu hóa");
            }`);

// Change Modal
let modalOld = `        open={blocked}
        title="Không thể vô hiệu hóa"
        onClose={() => setBlocked(false)}
        footer={<Button onClick={() => setBlocked(false)}>Đóng</Button>}
      >
        <div className="rounded-lg border border-brand-line bg-brand-soft p-4 text-sm">
          {active === "departments" && "Còn 3 lớp đang hoạt động, hãy vô hiệu hóa lớp trước."}
          {active === "offices" && "Còn 5 cán bộ đang hoạt động trong phòng ban."}
          {active === "classes" && "Còn 42 sinh viên đang hoạt động trong lớp."}
          {active === "users" && "Hãy gỡ chức vụ Lớp trưởng trước khi vô hiệu hóa."}
        </div>
      </Modal>`;

let modalNew = `        open={!!blocked}
        title="Không thể vô hiệu hóa"
        onClose={() => setBlocked(null)}
        footer={<Button onClick={() => setBlocked(null)}>Đóng</Button>}
      >
        <div className="rounded-lg border border-brand-line bg-brand-soft p-4 text-sm">
          {blocked}
        </div>
      </Modal>`;

jsx = jsx.replace(modalOld, modalNew);
fs.writeFileSync('../frontend-react/src/pages/admin/directory/DirectoryPage.jsx', jsx);
