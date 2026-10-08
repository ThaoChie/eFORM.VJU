const fs = require('fs');

const code = `import toast from "react-hot-toast";
import { AlertTriangle, CircleOff, CheckCircle, Download, Pencil, Plus, Search, Settings, Upload } from "lucide-react"
import { useEffect, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { Button, Card, IconButton, Input, Modal, PageTitle, Select, Table } from "../../../components/ui/Primitives"
import { useDirectoryStore } from "../../../stores/useDirectoryStore"

const tabs = [
  ["departments", "Khoa"],
  ["offices", "Phòng ban"],
  ["classes", "Lớp"],
  ["users", "Người dùng"],
]

export default function DirectoryPage() {
  const nav = useNavigate();
  const location = useLocation();
  const active = location.pathname.split("/").at(-1) || "departments";
  const [form, setForm] = useState(false);
  const [classForm, setClassForm] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [students, setStudents] = useState([]);
  
  const [filters, setFilters] = useState({ query: "", status: "Tất cả" });
  const [deans, setDeans] = useState([]);
  const [colConfig, setColConfig] = useState(false);
  const [hiddenCols, setHiddenCols] = useState({});
  const [importExcel, setImportExcel] = useState(false);
  const [importData, setImportData] = useState(null);
  const [importing, setImporting] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  
  const { items, loading, fetchItems } = useDirectoryStore();
  
  useEffect(() => {
    fetchItems(active);
    if (active === "departments") {
      import("../../../services/directory-service").then(({ directoryService }) => {
        directoryService.getDeans().then(res => {
          if (Array.isArray(res)) setDeans(res);
          else if (res && Array.isArray(res.data)) setDeans(res.data);
          else setDeans([]);
        }).catch(() => setDeans([]));
      });
    }
    if (active === "classes") {
      import("../../../lib/axios/client").then(({ client }) => {
        client.get("/departments").then(res => setDepartments(res || []));
        client.get("/directory/users?role=STUDENT").then(res => setStudents(res || []));
      });
    }
  }, [active, fetchItems]);

  const renderStatus = (status) => (
    <span className="inline-flex items-center gap-2 text-sm">
      <span className={\`size-2 rounded-full \${status === "Đang hoạt động" ? "bg-brand" : "border border-disabled bg-canvas"}\`} />
      {status}
    </span>
  );

  const actionButtons = (r) => (
    <div className="flex">
      {r.status === "Đang hoạt động" && (
        <IconButton label="Sửa" onClick={() => setForm({ mode: 'edit', ...r })}>
          <Pencil className="size-4" />
        </IconButton>
      )}
      {r.status === "Đang hoạt động" ? (
        <IconButton label="Vô hiệu hóa" onClick={async () => {
          try {
            const { client } = await import("../../../lib/axios/client");
            await client.put(\`/\${active}/\${r.id}/toggle-status\`);
            fetchItems(active);
          } catch (e) {
            toast.error(e.response?.data?.message || "Không thể vô hiệu hóa");
          }
        }}>
          <CircleOff className="size-4" />
        </IconButton>
      ) : (
        <IconButton label="Kích hoạt" onClick={async () => {
          try {
            const { client } = await import("../../../lib/axios/client");
            await client.put(\`/\${active}/\${r.id}/toggle-status\`);
            fetchItems(active);
          } catch (e) {
            toast.error("Lỗi kích hoạt");
          }
        }}>
          <CheckCircle className="size-4 text-green-500" />
        </IconButton>
      )}
    </div>
  );

  let columns = [];
  let rows = [];

  if (active === "departments") {
    columns = [
      { key: "stt", title: "STT", render: (_, i) => i + 1 },
      { key: "code", title: "Mã Khoa", render: (r) => <code className="font-mono">{r.code}</code> },
      { key: "name", title: "Tên Khoa" },
      { key: "dean", title: "Trưởng Khoa" },
      { key: "classesCount", title: "Số lớp", render: (r) => <span className="text-brand font-medium">{r.classesCount}</span> },
      { key: "status", title: "Trạng thái", render: (r) => renderStatus(r.status) },
      { key: "action", title: "Thao tác", render: actionButtons },
    ];
    rows = items.map((item) => ({
      id: item.id,
      code: item.deptCode,
      name: item.deptName,
      dean: item.deanName || "Chưa chỉ định",
      classesCount: item.classCount || 0,
      status: item.status === 1 ? "Đang hoạt động" : "Vô hiệu hóa",
    }));
  } else if (active === "classes") {
    columns = [
      { key: "stt", title: "STT", render: (_, i) => i + 1 },
      { key: "code", title: "Mã lớp", render: (r) => <code className="font-mono">{r.code}</code> },
      { key: "name", title: "Tên lớp" },
      { key: "department", title: "Khoa", render: (r) => (
        <div className="leading-tight">
          <div className="font-medium">{r.deptName}</div>
          <div className="text-xs text-muted font-mono">{r.deptCode}</div>
        </div>
      )},
      { key: "dean", title: "Trưởng Khoa", render: (r) => r.deanName || "Chưa chỉ định" },
      { key: "leader", title: "Lớp trưởng", render: (r) => r.leaders?.length > 0 ? r.leaders.map(l => l.fullName).join(", ") : "Chưa chỉ định" },
      { key: "deputy", title: "Lớp phó", render: (r) => r.deputies?.length > 0 ? r.deputies.map(l => l.fullName).join(", ") : "Chưa có" },
      { key: "studentsCount", title: "Sĩ số", render: (r) => <span className="text-brand font-medium">{r.studentCount || 0}</span> },
      { key: "status", title: "Trạng thái", render: (r) => renderStatus(r.status === 1 ? "Đang hoạt động" : "Vô hiệu hóa") },
      { key: "action", title: "Thao tác", render: (r) => (
        <div className="flex">
          {r.status === 1 && (
            <IconButton label="Sửa" onClick={() => setClassForm({ mode: 'edit', id: r.id, deptId: r.deptId, classCode: r.code, className: r.name, leaderIds: r.leaders?.map(l=>l.id) || [], deputyIds: r.deputies?.map(l=>l.id) || [], status: r.status })}>
              <Pencil className="size-4" />
            </IconButton>
          )}
          {r.status === 1 ? (
            <IconButton label="Vô hiệu hóa" onClick={async () => {
              try { const { client } = await import("../../../lib/axios/client"); await client.put(\`/\${active}/\${r.id}/toggle-status\`); fetchItems(active); } 
              catch (e) { toast.error(e.response?.data?.message || "Không thể vô hiệu hóa"); }
            }}>
              <CircleOff className="size-4" />
            </IconButton>
          ) : (
            <IconButton label="Kích hoạt" onClick={async () => {
              try { const { client } = await import("../../../lib/axios/client"); await client.put(\`/\${active}/\${r.id}/toggle-status\`); fetchItems(active); } 
              catch (e) { toast.error("Lỗi kích hoạt"); }
            }}>
              <CheckCircle className="size-4 text-green-500" />
            </IconButton>
          )}
        </div>
      )}
    ];
    rows = items.map(item => ({
      ...item,
      code: item.classCode,
      name: item.className
    }));
  }

  const renderFilters = () => {
    if (active === "departments" || active === "offices") {
      rows = rows.filter(r => {
        if (filters.status !== "Tất cả" && r.status !== filters.status) return false;
        if (filters.query) {
           const q = filters.query.toLowerCase();
           return r.code?.toLowerCase().includes(q) || r.name?.toLowerCase().includes(q) || r.fullName?.toLowerCase().includes(q);
        }
        return true;
      });
      return (
        <Card className="mb-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Input label="Mã - Tên" placeholder="Nhập mã hoặc tên" value={filters.query} onChange={(e) => setFilters({...filters, query: e.target.value})} />
            <Select label="Trạng thái" value={filters.status} onChange={(e) => setFilters({...filters, status: e.target.value})}>
              <option>Tất cả</option>
              <option>Đang hoạt động</option>
              <option>Vô hiệu hóa</option>
            </Select>
            <div className="flex items-end gap-3 md:col-start-3 md:justify-end">
              <Button variant="ghost" onClick={() => setFilters({query: "", status: "Tất cả"})}>Xóa bộ lọc</Button>
              <Button variant="primary"><Search className="size-4" /> Tìm kiếm</Button>
            </div>
          </div>
        </Card>
      );
    }
    if (active === "classes") {
      rows = rows.filter(r => {
        if (filters.status !== "Tất cả" && (r.status === 1 ? "Đang hoạt động" : "Vô hiệu hóa") !== filters.status) return false;
        if (filters.query) {
           const q = filters.query.toLowerCase();
           return r.code?.toLowerCase().includes(q) || r.name?.toLowerCase().includes(q);
        }
        return true;
      });
      return (
        <Card className="mb-4">
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
        </Card>
      );
    }
    return null;
  };

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
    return (
      <Button variant="primary" onClick={() => setForm({ mode: 'create' })}>
        <Plus className="size-4" /> Thêm mới
      </Button>
    );
  };

  return (
    <>
      <PageTitle title="Danh bạ đơn vị" description="Dữ liệu danh mục được ghi trực tiếp, không qua quy trình duyệt." />
      <div className="mb-4 flex overflow-x-auto border-b border-line">
        {tabs.map(([key, label]) => (
          <button
            key={key}
            onClick={() => nav(\`/admin/directory/\${key}\`)}
            className={\`whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition-colors \${active === key ? 'border-brand text-brand' : 'border-transparent text-muted hover:border-line hover:text-foreground'}\`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Quản lý danh mục</h1>
        {renderToolbar()}
      </div>

      {renderFilters()}

      <Card className="p-0">
        <Table columns={columns.filter(c => !hiddenCols[c.key])} rows={rows} loading={loading} emptyMessage="Không có dữ liệu danh mục" />
      </Card>

      <Modal open={!!form} title={form?.mode === 'edit' ? "Chỉnh sửa danh mục" : "Thêm mới danh mục"} onClose={() => setForm(false)} footer={
          <>
            <Button onClick={() => setForm(false)}>Hủy</Button>
            <Button variant="primary" onClick={async () => {
              if (active === "departments" && form.mode === 'create') {
                try {
                  const { client } = await import("../../../lib/axios/client");
                  const deptCode = document.querySelector('input[placeholder="Nhập mã"]').value;
                  const deptName = document.querySelector('input[placeholder="Nhập tên"]').value;
                  if (!deptCode || !deptName) return toast.error("Vui lòng nhập đủ mã và tên khoa");
                  await client.post("/departments", { deptCode, deptName });
                  toast.success("Tạo Khoa thành công!");
                  setForm(false);
                  fetchItems(active);
                } catch (e) {
                  toast.error(e.response?.data?.message || "Lỗi tạo Khoa");
                }
              } else {
                setForm(false);
              }
            }}>Lưu</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Mã" required placeholder="Nhập mã" defaultValue={form?.code || ""} disabled={form?.mode === 'edit' && active === "departments"} />
          <Input label="Tên" required placeholder="Nhập tên" defaultValue={form?.name || ""} />
        </div>
      </Modal>

      <Modal open={colConfig} title="Cấu hình cột hiển thị" onClose={() => setColConfig(false)} footer={<Button variant="primary" onClick={() => setColConfig(false)}>Xong</Button>}>
        <div className="space-y-3">
          <p className="text-sm text-muted">Chọn các cột bạn muốn hiển thị trên lưới dữ liệu:</p>
          <div className="grid grid-cols-2 gap-3 mt-4">
            {columns.map(c => (
              <label key={c.key} className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" className="rounded border-line text-brand focus:ring-brand" checked={!hiddenCols[c.key]} onChange={(e) => setHiddenCols(prev => ({...prev, [c.key]: !e.target.checked}))} />
                {c.title.replace(" *", "")}
              </label>
            ))}
          </div>
        </div>
      </Modal>

      <Modal open={importExcel} wide={importData !== null} title="Nhập dữ liệu từ Excel" onClose={() => { setImportExcel(false); setImportData(null); setSelectedFile(null); }} footer={
          <>
            <Button onClick={() => { setImportExcel(false); setImportData(null); setSelectedFile(null); }}>Hủy</Button>
            {importData ? (
               <Button variant="primary" loading={importing} onClick={async () => {
                 setImporting(true);
                 try {
                   const { directoryService } = await import("../../../services/directory-service");
                   await (active === "classes" ? directoryService.importClasses(selectedFile, false) : directoryService.importDepartments(selectedFile, false));
                   toast.success("Nhập dữ liệu thành công!");
                   setImportExcel(false);
                   setImportData(null);
                   setSelectedFile(null);
                   fetchItems(active);
                 } catch (err) {
                   toast.error("Có lỗi xảy ra khi nhập dữ liệu!");
                 } finally {
                   setImporting(false);
                 }
               }}>Xác nhận Nhập ({importData.validRows} dòng)</Button>
            ) : (
               <Button variant="primary" disabled={!selectedFile} loading={importing} onClick={async () => {
                 setImporting(true);
                 try {
                   const { directoryService } = await import("../../../services/directory-service");
                   const res = await (active === "classes" ? directoryService.importClasses(selectedFile, true) : directoryService.importDepartments(selectedFile, true));
                   setImportData(res);
                 } catch (err) {
                   toast.error("Lỗi đọc file Excel!");
                 } finally {
                   setImporting(false);
                 }
               }}>Xem trước dữ liệu</Button>
            )}
          </>
        }
      >
        <div className="space-y-4">
          {!importData ? (
            <>
              <div onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = '.xlsx, .xls';
                  input.onchange = (e) => {
                    if (e.target.files.length > 0) setSelectedFile(e.target.files[0]);
                  };
                  input.click();
                }}
                className={\`rounded-lg border-2 border-dashed p-8 text-center cursor-pointer transition \${selectedFile ? 'border-brand bg-brand-soft' : 'border-line hover:bg-canvas'}\`}
              >
                <Upload className={\`size-8 mx-auto mb-3 \${selectedFile ? 'text-brand' : 'text-muted'}\`} />
                <p className={\`font-medium \${selectedFile ? 'text-brand' : ''}\`}>{selectedFile ? selectedFile.name : 'Click để chọn file từ máy tính'}</p>
                {!selectedFile && <p className="text-sm text-muted mt-1">hoặc kéo thả file Excel vào đây</p>}
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex gap-4 mb-4">
                <div className="flex-1 bg-green-50 text-green-700 p-4 rounded-lg border border-green-200">
                  <p className="text-sm font-medium">Hợp lệ</p>
                  <p className="text-2xl font-bold">{importData.validRows}</p>
                </div>
                <div className="flex-1 bg-red-50 text-red-700 p-4 rounded-lg border border-red-200">
                  <p className="text-sm font-medium">Lỗi</p>
                  <p className="text-2xl font-bold">{importData.invalidRows}</p>
                </div>
              </div>
              {importData.invalidRows > 0 ? (
                <div className="text-sm text-red-600">
                  <p className="font-medium mb-2">Chi tiết lỗi:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    {importData.errors.map((err, idx) => <li key={idx}>{err}</li>)}
                  </ul>
                </div>
              ) : (
                <p className="text-sm text-green-600 font-medium">Tất cả dữ liệu đều hợp lệ. Bạn có thể tiến hành nhập!</p>
              )}
            </div>
          )}
        </div>
      </Modal>

      {classForm && (() => {
        const selectedDept = departments.find(d => d.id === Number(classForm.deptId));
        return (
          <Modal open={true} title={classForm.mode === 'edit' ? "Chỉnh sửa Lớp" : "Thêm mới Lớp"} onClose={() => setClassForm(null)} footer={
              <>
                <Button onClick={() => setClassForm(null)}>Hủy</Button>
                <Button variant="primary" onClick={async () => {
                  if (!classForm.deptId || !classForm.classCode || !classForm.className) return toast.error("Vui lòng nhập đủ Khoa, Mã lớp, Tên lớp");
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
                    toast.error(e.response?.data?.message || "Lỗi xử lý Lớp");
                  }
                }}>Lưu</Button>
              </>
            }
          >
            <div className="space-y-4">
              <Select label="Khoa *" value={classForm.deptId} onChange={(e) => setClassForm({...classForm, deptId: e.target.value})}>
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
    </>
  )
}
`;

fs.writeFileSync('src/pages/admin/directory/DirectoryPage.jsx', code);
