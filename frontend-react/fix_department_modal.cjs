const fs = require('fs');
let path = 'src/pages/admin/directory/DirectoryPage.jsx';
let content = fs.readFileSync(path, 'utf-8');

// The generic modal is at line 471, we need to modify it.
// Right now it's: <Modal open={!!form && active !== "users"} ...>
// I'll change it to <Modal open={!!form && active === "offices"} ...>
// And then append a dedicated Modal for active === "departments".

const genericModalMatch = /<Modal open=\{!!form && active !== "users"\}.*?<\/Modal>/s;
const genericModal = content.match(genericModalMatch);

if (genericModal) {
    let replacedGeneric = genericModal[0].replace('active !== "users"', 'active === "offices"');
    
    const departmentModal = `
      {active === "departments" && form && (
        <Modal open={true} title={form.mode === 'edit' ? "Chỉnh sửa Khoa" : "Thêm mới Khoa"} onClose={() => setForm(false)} footer={
          <>
            <Button onClick={() => setForm(false)}>Hủy</Button>
            <Button variant="primary" onClick={async () => {
              try {
                const { client } = await import("../../../lib/axios/client");
                if (!form.deptCode || !form.deptName) return toast.error("Vui lòng nhập đủ mã và tên khoa");
                if (form.mode === 'create') {
                  await client.post("/departments", form);
                  toast.success("Tạo Khoa thành công!");
                } else {
                  await client.put(\`/departments/\${form.id}\`, form);
                  toast.success("Cập nhật Khoa thành công!");
                }
                setForm(false);
                fetchItems(active);
              } catch (e) {
                toast.error(e.response?.data?.message || "Lỗi xử lý Khoa");
              }
            }}>Lưu</Button>
          </>
        }>
          <div className="space-y-4">
            <Input label="Mã khoa *" placeholder="Nhập mã khoa" value={form.deptCode || form.code || ""} onChange={e => setForm({...form, deptCode: e.target.value})} disabled={form.mode === 'edit'} />
            <Input label="Tên khoa *" placeholder="Nhập tên khoa" value={form.deptName || form.name || ""} onChange={e => setForm({...form, deptName: e.target.value})} />
            <Select label="Trưởng khoa" value={form.deanId || ""} onChange={e => setForm({...form, deanId: e.target.value ? Number(e.target.value) : null})}>
              <option value="">Chưa chỉ định</option>
              {deans.map(d => <option key={d.id} value={d.id}>{d.fullName}</option>)}
            </Select>
            <Select label="Trạng thái" value={form.status !== undefined ? form.status : (form.statusStr === 'Vô hiệu hóa' ? 0 : 1)} onChange={e => setForm({...form, status: Number(e.target.value)})}>
              <option value={1}>Đang hoạt động</option>
              <option value={0}>Vô hiệu hóa</option>
            </Select>
          </div>
        </Modal>
      )}
    `;

    content = content.replace(genericModal[0], replacedGeneric + '\\n' + departmentModal);
    fs.writeFileSync(path, content);
}
