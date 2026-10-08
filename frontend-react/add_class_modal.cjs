const fs = require('fs');
let jsx = fs.readFileSync('src/pages/admin/directory/DirectoryPage.jsx', 'utf-8');

let classModal = `
      {classForm && (() => {
        const selectedDept = departments.find(d => d.id === Number(classForm.deptId));
        return (
          <Modal
            open={true}
            title={classForm.mode === 'edit' ? "Chỉnh sửa Lớp" : "Thêm mới Lớp"}
            onClose={() => setClassForm(null)}
            footer={
              <>
                <Button onClick={() => setClassForm(null)}>Hủy</Button>
                <Button variant="primary" onClick={async () => {
                  if (!classForm.deptId || !classForm.classCode || !classForm.className) {
                    return toast.error("Vui lòng nhập đủ Khoa, Mã lớp, Tên lớp");
                  }
                  try {
                    const { client } = await import("../../../lib/axios/client");
                    if (classForm.mode === 'create') {
                      await client.post("/classes", classForm);
                      toast.success("Tạo Lớp thành công!");
                    } else {
                      await client.put(\`/classes/\${classForm.id}\`, classForm);
                      toast.success("Cập nhật Lớp thành công!");
                    }
                    setClassForm(null);
                    fetchItems(active);
                  } catch(e) {
                    toast.error(e.response?.data?.message || e.message || "Lỗi xử lý Lớp");
                  }
                }}>Lưu</Button>
              </>
            }
          >
            <div className="space-y-4">
              <Select label="Khoa *" value={classForm.deptId} onChange={(e) => setClassForm({...classForm, deptId: e.target.value})} disabled={classForm.mode === 'edit'}>
                <option value="">Chọn Khoa</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.deptCode} - {d.deptName}</option>)}
              </Select>
              <Input label="Tên Khoa" disabled value={selectedDept ? selectedDept.deptName : ""} />
              <Input label="Mã lớp *" value={classForm.classCode} onChange={(e) => setClassForm({...classForm, classCode: e.target.value})} disabled={classForm.mode === 'edit'} />
              <Input label="Tên lớp *" value={classForm.className} onChange={(e) => setClassForm({...classForm, className: e.target.value})} />
              <Input label="Trưởng Khoa" disabled value={selectedDept ? (selectedDept.deanName || "Chưa chỉ định") : ""} />
              <div>
                <label className="mb-1 block text-sm font-medium">Lớp trưởng</label>
                <select multiple className="w-full rounded border border-line px-3 py-2 text-sm focus:border-brand focus:outline-none" value={classForm.leaderIds} onChange={(e) => setClassForm({...classForm, leaderIds: Array.from(e.target.selectedOptions, option => Number(option.value))})}>
                  {students.map(s => <option key={s.id} value={s.id}>{s.userCode || s.email} - {s.fullName}</option>)}
                </select>
                <span className="text-xs text-muted">Giữ Ctrl hoặc Cmd để chọn nhiều</span>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Lớp phó</label>
                <select multiple className="w-full rounded border border-line px-3 py-2 text-sm focus:border-brand focus:outline-none" value={classForm.deputyIds} onChange={(e) => setClassForm({...classForm, deputyIds: Array.from(e.target.selectedOptions, option => Number(option.value))})}>
                  {students.map(s => <option key={s.id} value={s.id}>{s.userCode || s.email} - {s.fullName}</option>)}
                </select>
                <span className="text-xs text-muted">Giữ Ctrl hoặc Cmd để chọn nhiều</span>
              </div>
              <Select label="Trạng thái" value={classForm.status} onChange={(e) => setClassForm({...classForm, status: Number(e.target.value)})}>
                <option value={1}>Đang hoạt động</option>
                <option value={0}>Vô hiệu hóa</option>
              </Select>
            </div>
          </Modal>
        )
      })()}
`;
jsx = jsx.replace('</>\n  )\n}', classModal + '\n    </>\n  )\n}');
fs.writeFileSync('src/pages/admin/directory/DirectoryPage.jsx', jsx);
