const fs = require('fs');
let path = 'src/pages/admin/directory/DirectoryPage.jsx';
let content = fs.readFileSync(path, 'utf-8');

const userModalCode = `
      {active === "users" && form && (
        <Modal open={true} title={form.mode === 'edit' ? "Chỉnh sửa Người dùng" : "Thêm mới Người dùng"} onClose={() => setForm(false)} footer={
          <>
            <Button onClick={() => setForm(false)}>Hủy</Button>
            <Button variant="primary" onClick={async () => {
              if (!form.userCode || !form.fullName || !form.email) return toast.error("Vui lòng nhập đủ Mã, Tên và Email");
              try {
                const { client } = await import("../../../lib/axios/client");
                if (form.mode === 'create') {
                  await client.post("/directory/users", form);
                  toast.success("Tạo Người dùng thành công!");
                } else {
                  await client.put(\`/directory/users/\${form.id}\`, form);
                  toast.success("Cập nhật Người dùng thành công!");
                }
                setForm(false);
                fetchItems(active);
              } catch(e) {
                toast.error(e.response?.data?.message || "Lỗi xử lý Người dùng");
              }
            }}>Lưu</Button>
          </>
        }>
          <div className="space-y-4">
            <Input label="Mã người dùng *" value={form.userCode || ""} onChange={e => setForm({...form, userCode: e.target.value})} disabled={form.mode === 'edit'} />
            <Input label="Họ và tên *" value={form.fullName || ""} onChange={e => setForm({...form, fullName: e.target.value})} />
            <Input label="Email *" value={form.email || ""} onChange={e => setForm({...form, email: e.target.value})} />
            
            <Select label="Vai trò *" value={form.role || "STUDENT"} onChange={e => setForm({...form, role: e.target.value})}>
              <option value="ADMIN">Quản trị viên (Admin)</option>
              <option value="DEAN">Trưởng khoa</option>
              <option value="CLASS_LEADER">Lớp trưởng</option>
              <option value="CLASS_DEPUTY">Lớp phó</option>
              <option value="STUDENT">Sinh viên</option>
            </Select>

            {["STUDENT", "DEAN"].includes(form.role) && (
              <Select label="Khoa" value={form.departmentId || form.deptId || ""} onChange={e => setForm({...form, departmentId: Number(e.target.value)})}>
                <option value="">Chọn Khoa...</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.deptCode} - {d.deptName}</option>)}
              </Select>
            )}

            {form.role === "ADMIN" && (
              <Select label="Phòng ban" value={form.officeId || ""} onChange={e => setForm({...form, officeId: Number(e.target.value)})}>
                <option value="">Chọn Phòng ban...</option>
                {offices.map(o => <option key={o.id} value={o.id}>{o.officeCode || o.code} - {o.officeName || o.name}</option>)}
              </Select>
            )}

            {form.role === "STUDENT" && (
              <Select label="Lớp" value={form.classId || ""} onChange={e => setForm({...form, classId: Number(e.target.value)})}>
                <option value="">Chọn Lớp...</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.classCode || c.code} - {c.className || c.name}</option>)}
              </Select>
            )}

            {form.role === "STUDENT" && (
              <Input label="Niên khóa" placeholder="Ví dụ: K21" value={form.academicCohort || ""} onChange={e => setForm({...form, academicCohort: e.target.value})} />
            )}

            <Select label="Trạng thái" value={form.status !== undefined ? form.status : 1} onChange={e => setForm({...form, status: Number(e.target.value)})}>
              <option value={1}>Đang hoạt động</option>
              <option value={0}>Vô hiệu hóa</option>
            </Select>
          </div>
        </Modal>
      )}`;

content = content.replace(
  '</>\n  )\n}',
  userModalCode + '\n    </>\n  )\n}'
);

fs.writeFileSync(path, content);
