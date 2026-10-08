import toast from "react-hot-toast";
import { AlertTriangle, CircleOff, CheckCircle, Download, Pencil, Plus, Search, Settings, Upload, ChevronLeft, ChevronRight } from "lucide-react"
import { useEffect, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { Button, Card, IconButton, Input, Modal, PageTitle, Select, Table } from "../../../components/ui/Primitives"
import { useDirectoryStore } from "../../../stores/useDirectoryStore"
import ReactSelect from "react-select";

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
  const [offices, setOffices] = useState([]);
  const [classes, setClasses] = useState([]);
  
  const [filters, setFilters] = useState({ query: "", status: "Tất cả" });
  const [page, setPage] = useState(1);
  const [deans, setDeans] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [colConfig, setColConfig] = useState(false);
  const [hiddenCols, setHiddenCols] = useState({});
  const [importExcel, setImportExcel] = useState(false);
  const [importData, setImportData] = useState(null);
  const [importing, setImporting] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  
  const { items, loading, fetchItems } = useDirectoryStore();
  
  useEffect(() => {
    setPage(1);
  }, [active, filters]);

  useEffect(() => {
    fetchItems(active);
    if (active === "offices") {
      import("../../../lib/axios/client").then(({ client }) => {
        client.get("/directory/users?role=ADMIN").then(res => setAdmins(Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : [])));
      });
    }
    if (active === "departments") {
      import("../../../services/directory-service").then(({ directoryService }) => {
        directoryService.getDeans().then(res => {
          if (Array.isArray(res)) setDeans(res);
          else if (res && Array.isArray(res.data)) setDeans(res.data);
          else setDeans([]);
        }).catch(() => setDeans([]));
      });
    }
    if (active === "users") {
      import("../../../lib/axios/client").then(({ client }) => {
        client.get("/departments").then(res => setDepartments(res || []));
        client.get("/offices").then(res => setOffices(res || []));
        client.get("/classes").then(res => setClasses(res || []));
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
      <span className={`size-2 rounded-full ${status === "Đang hoạt động" ? "bg-brand" : "border border-disabled bg-canvas"}`} />
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
            await client.put(`/${active}/${r.id}/toggle-status`);
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
            await client.put(`/${active}/${r.id}/toggle-status`);
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
      deanId: item.deanId,
      classesCount: item.classCount || 0,
      status: item.status === 1 ? "Đang hoạt động" : "Vô hiệu hóa",
    }));
  } else if (active === "classes") {
    columns = [
      { key: "stt", title: "STT", render: (_, i) => i + 1 },
      { key: "code", title: "Mã lớp", render: (r) => <code className="font-mono">{r.code}</code> },
      { key: "name", title: "Tên lớp" },
      { key: "academicCohort", title: "Niên khóa" },
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
            <IconButton label="Sửa" onClick={() => setClassForm({ mode: 'edit', id: r.id, deptId: r.deptId, classCode: r.code, className: r.name, academicCohort: r.academicCohort || "", leaderIds: r.leaders?.map(l=>l.id) || [], deputyIds: r.deputies?.map(l=>l.id) || [], status: r.status })}>
              <Pencil className="size-4" />
            </IconButton>
          )}
          {r.status === 1 ? (
            <IconButton label="Vô hiệu hóa" onClick={async () => {
              try { const { client } = await import("../../../lib/axios/client"); await client.put(`/${active}/${r.id}/toggle-status`); fetchItems(active); } 
              catch (e) { toast.error(e.response?.data?.message || "Không thể vô hiệu hóa"); }
            }}>
              <CircleOff className="size-4" />
            </IconButton>
          ) : (
            <IconButton label="Kích hoạt" onClick={async () => {
              try { const { client } = await import("../../../lib/axios/client"); await client.put(`/${active}/${r.id}/toggle-status`); fetchItems(active); } 
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
      name: item.className,
      academicCohort: item.academicCohort,
      deptId: item.deptId
    }));
  } else if (active === "users") {
    columns = [
      { key: "stt", title: "STT", render: (_, i) => i + 1 },
      { key: "userCode", title: "Mã người dùng", render: (r) => <code className="font-mono">{r.userCode}</code> },
      { key: "fullName", title: "Họ và tên" },
      { key: "email", title: "Email" },
      { key: "department", title: "Khoa/Phòng", render: (r) => r.deptName || r.officeName || "Không có" },
      { key: "role", title: "Vai trò" },
      { key: "status", title: "Trạng thái", render: (r) => renderStatus(r.status === 1 ? "Đang hoạt động" : "Vô hiệu hóa") },
      { key: "action", title: "Thao tác", render: (r) => (
        <div className="flex">
          {r.status === 1 && (
            <IconButton label="Sửa" onClick={() => setForm({ mode: 'edit', ...r })}>
              <Pencil className="size-4" />
            </IconButton>
          )}
          {r.status === 1 ? (
            <IconButton label="Vô hiệu hóa" onClick={async () => {
              try { const { client } = await import("../../../lib/axios/client"); await client.put(`/${active}/${r.id}/toggle-status`); fetchItems(active); } 
              catch (e) { toast.error(e.response?.data?.message || "Không thể vô hiệu hóa"); }
            }}>
              <CircleOff className="size-4" />
            </IconButton>
          ) : (
            <IconButton label="Kích hoạt" onClick={async () => {
              try { const { client } = await import("../../../lib/axios/client"); await client.put(`/${active}/${r.id}/toggle-status`); fetchItems(active); } 
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
    }));
  } else if (active === "offices") {
    columns = [
      { key: "stt", title: "STT", render: (_, i) => i + 1 },
      { key: "code", title: "Mã phòng ban", render: (r) => <code className="font-mono">{r.code}</code> },
      { key: "name", title: "Tên phòng ban" },
      { key: "head", title: "Trưởng phòng", render: (r) => r.headName || "Chưa chỉ định" },
      { key: "status", title: "Trạng thái", render: (r) => renderStatus(r.status === 1 ? "Đang hoạt động" : "Vô hiệu hóa") },
      { key: "action", title: "Thao tác", render: (r) => (
        <div className="flex">
          {r.status === 1 && (
            <IconButton label="Sửa" onClick={() => setForm({ mode: 'edit', ...r })}>
              <Pencil className="size-4" />
            </IconButton>
          )}
          {r.status === 1 ? (
            <IconButton label="Vô hiệu hóa" onClick={async () => {
              try { const { client } = await import("../../../lib/axios/client"); await client.put(`/${active}/${r.id}/toggle-status`); fetchItems(active); } 
              catch (e) { toast.error(e.response?.data?.message || "Không thể vô hiệu hóa"); }
            }}>
              <CircleOff className="size-4" />
            </IconButton>
          ) : (
            <IconButton label="Kích hoạt" onClick={async () => {
              try { const { client } = await import("../../../lib/axios/client"); await client.put(`/${active}/${r.id}/toggle-status`); fetchItems(active); } 
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
      code: item.officeCode || item.code || "",
      name: item.officeName || item.name || "",
      headName: item.headName || "Chưa chỉ định",
      headId: item.headId,
      status: item.status
    }));
  }

  const renderFilters = () => {
    if (active === "departments" || active === "offices") {
      rows = rows.filter(r => {
        const itemStatus = (r.status === 1 || r.status === "Đang hoạt động") ? "Đang hoạt động" : "Vô hiệu hóa";
        if (filters.status !== "Tất cả" && itemStatus !== filters.status) return false;
        if (filters.query) {
           const q = filters.query.toLowerCase();
           return r.code?.toLowerCase().includes(q) || r.name?.toLowerCase().includes(q) || r.fullName?.toLowerCase().includes(q);
        }
        return true;
      });
      return (
        <Card className="mb-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Input label={active === "departments" ? "Mã - Tên Khoa" : "Mã - Tên Phòng ban"} placeholder="Nhập mã hoặc tên..." value={filters.query} onChange={(e) => setFilters({...filters, query: e.target.value})} />
            
            <Select label="Trạng thái" value={filters.status} onChange={(e) => setFilters({...filters, status: e.target.value})}>
              <option>Tất cả</option>
              <option>Đang hoạt động</option>
              <option>Vô hiệu hóa</option>
            </Select>
            
            <div className="flex items-end gap-3 md:justify-end">
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
        if (filters.dept && r.deptId !== Number(filters.dept)) return false;
        if (filters.cohort && r.academicCohort && !r.academicCohort.toLowerCase().includes(filters.cohort.toLowerCase())) return false;
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
          </div>
        </Card>
      );
    }
    if (active === "users") {
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
            <div className="hidden md:block"></div>
            
            <Select label="Trạng thái" value={filters.status} onChange={(e) => setFilters({...filters, status: e.target.value})}>
              <option>Tất cả</option>
              <option>Đang hoạt động</option>
              <option>Vô hiệu hóa</option>
            </Select>
            <Input label="Khoa" placeholder="Tìm tên hoặc mã khoa..." value={filters.deptSearch || ""} onChange={(e) => setFilters({...filters, deptSearch: e.target.value})} />
            
            <div className="flex items-end gap-3 md:justify-end">
              <Button variant="ghost" onClick={() => setFilters({query: "", status: "Tất cả", role: "", deptSearch: ""})}>Xóa bộ lọc</Button>
              <Button variant="primary"><Search className="size-4" /> Tìm kiếm</Button>
            </div>
          </div>
        </Card>
      );
    }
    return null;
  };

  const renderToolbar = () => {
    if (active === "classes" || active === "departments" || active === "users" || active === "offices") {
      return (
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setColConfig(true)}>
            <Settings className="size-4" /> Cấu hình cột
          </Button>
          <Button onClick={() => {
            const urls = {
              classes: "http://localhost:8080/api/v1/classes/template-excel",
              departments: "http://localhost:8080/api/v1/departments/template-excel",
              offices: "http://localhost:8080/api/v1/offices/template-excel",
              users: "http://localhost:8080/api/v1/directory/users/template-excel"
            };
            window.open(urls[active] || urls.users, "_blank");
          }}>
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
          {active === "classes" ? <Button variant="primary" onClick={() => setClassForm({ mode: 'create', deptId: "", classCode: "", className: "", academicCohort: "", leaderIds: [], deputyIds: [], status: 1 })}>
            <Plus className="size-4" /> Thêm mới
          </Button> : active === "users" ? <Button variant="primary" onClick={() => setForm({ mode: 'create', role: 'STUDENT', status: 1 })}>
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
      <PageTitle title="Danh bạ đơn vị" description="Hệ thống được phát triển bởi nhóm sinh viên Trường Đại học Việt Nhật" />
      <div className="mb-4 flex overflow-x-auto border-b border-line">
        {tabs.map(([key, label]) => (
          <button
            key={key}
            onClick={() => nav(`/admin/directory/${key}`)}
            className={`whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${active === key ? 'border-brand text-brand' : 'border-transparent text-muted hover:border-line hover:text-foreground'}`}
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

      {(() => {
        const pageSize = 10;
        const totalPages = Math.ceil(rows.length / pageSize) || 1;
        const currentData = rows.slice((page - 1) * pageSize, page * pageSize);
        return (
          <Card className="p-0">
            <Table columns={columns.filter(c => !hiddenCols[c.key])} rows={currentData} loading={loading} emptyMessage="Không có dữ liệu danh mục" />
            <div className="flex items-center justify-between border-t border-line px-4 py-3">
              <span className="text-sm text-muted">
                Hiển thị {rows.length === 0 ? 0 : (page - 1) * pageSize + 1} đến {Math.min(page * pageSize, rows.length)} trong số {rows.length} mục
              </span>
              <div className="flex items-center gap-2">
                <Button variant="ghost" disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
                  <ChevronLeft className="size-4" />
                </Button>
                <span className="text-sm font-medium px-2">Trang {page} / {totalPages}</span>
                <Button variant="ghost" disabled={page === totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          </Card>
        );
      })()}

      {active === "offices" && form && (
        <Modal open={true} title={form.mode === 'edit' ? "Chỉnh sửa Phòng ban" : "Thêm mới Phòng ban"} onClose={() => setForm(false)} footer={
          <>
            <Button onClick={() => setForm(false)}>Hủy</Button>
            <Button variant="primary" onClick={async () => {
              try {
                const { client } = await import("../../../lib/axios/client");
                if (!form.officeCode && !form.code) return toast.error("Vui lòng nhập mã phòng ban");
                if (!form.officeName && !form.name) return toast.error("Vui lòng nhập tên phòng ban");
                const payload = {
                  officeCode: form.officeCode || form.code,
                  officeName: form.officeName || form.name,
                  status: form.status !== undefined ? form.status : 1,
                  headId: form.headId || null
                };
                if (form.mode === 'create') {
                  await client.post("/offices", payload);
                  toast.success("Tạo Phòng ban thành công!");
                } else {
                  await client.put(`/offices/${form.id}`, payload);
                  toast.success("Cập nhật Phòng ban thành công!");
                }
                setForm(false);
                fetchItems(active);
              } catch (e) {
                toast.error(e.response?.data?.message || "Lỗi xử lý Phòng ban");
              }
            }}>Lưu</Button>
          </>
        }>
          <div className="space-y-4">
            <Input label="Mã phòng ban *" placeholder="Nhập mã phòng ban" value={form.officeCode || form.code || ""} onChange={e => setForm({...form, officeCode: e.target.value})} disabled={form.mode === 'edit'} />
            <Input label="Tên phòng ban *" placeholder="Nhập tên phòng ban" value={form.officeName || form.name || ""} onChange={e => setForm({...form, officeName: e.target.value})} />
            <Select label="Trưởng phòng ban" value={form.headId || ""} onChange={e => setForm({...form, headId: e.target.value ? Number(e.target.value) : null})}>
              <option value="">Chưa chỉ định</option>
              {admins.map(a => <option key={a.id} value={a.id}>{a.userCode ? a.userCode + ' - ' : ''}{a.fullName}</option>)}
            </Select>
            <Select label="Trạng thái" value={form.status !== undefined ? form.status : 1} onChange={e => setForm({...form, status: Number(e.target.value)})}>
              <option value={1}>Đang hoạt động</option>
              <option value={0}>Vô hiệu hóa</option>
            </Select>
          </div>
        </Modal>
      )}
    
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
                  await client.put(`/departments/${form.id}`, form);
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
                   await (active === "classes" ? directoryService.importClasses(selectedFile, false) : active === "offices" ? directoryService.importOffices(selectedFile, false) : directoryService.importDepartments(selectedFile, false));
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
                   const res = await (active === "classes" ? directoryService.importClasses(selectedFile, true) : active === "offices" ? directoryService.importOffices(selectedFile, true) : directoryService.importDepartments(selectedFile, true));
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
                className={`rounded-lg border-2 border-dashed p-8 text-center cursor-pointer transition ${selectedFile ? 'border-brand bg-brand-soft' : 'border-line hover:bg-canvas'}`}
              >
                <Upload className={`size-8 mx-auto mb-3 ${selectedFile ? 'text-brand' : 'text-muted'}`} />
                <p className={`font-medium ${selectedFile ? 'text-brand' : ''}`}>{selectedFile ? selectedFile.name : 'Click để chọn file từ máy tính'}</p>
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
                      await client.put(`/classes/${classForm.id}`, classForm);
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
              <Input label="Niên khóa" placeholder="Nhập niên khóa (Ví dụ: K21)" value={classForm.academicCohort || ""} onChange={(e) => setClassForm({...classForm, academicCohort: e.target.value})} />
              <Input label="Trưởng Khoa" disabled value={selectedDept ? (selectedDept.deanName || "Chưa chỉ định") : ""} />
              {(() => {
                const studentOptions = students.map(s => ({
                  value: s.id,
                  label: `${s.userCode || s.email} - ${s.fullName}`
                }));
                const leaderOptions = studentOptions.filter(opt => !(classForm.deputyIds || []).includes(opt.value));
                const selectedLeaders = studentOptions.filter(opt => (classForm.leaderIds || []).includes(opt.value));
                
                const deputyOptions = studentOptions.filter(opt => !(classForm.leaderIds || []).includes(opt.value));
                const selectedDeputies = studentOptions.filter(opt => (classForm.deputyIds || []).includes(opt.value));

                return (
                  <>
                    <div className="z-20 relative">
                      <label className="mb-1 block text-sm font-medium">Lớp trưởng</label>
                      <ReactSelect 
                        isMulti 
                        options={leaderOptions} 
                        value={selectedLeaders}
                        onChange={(selected) => setClassForm({...classForm, leaderIds: selected ? selected.map(s => s.value) : []})}
                        placeholder="Tìm kiếm và chọn lớp trưởng..."
                        noOptionsMessage={() => "Không tìm thấy kết quả"}
                        styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                        menuPortalTarget={document.body}
                        menuPosition="fixed"
                      />
                    </div>
                    <div className="z-10 relative">
                      <label className="mb-1 block text-sm font-medium">Lớp phó</label>
                      <ReactSelect 
                        isMulti 
                        options={deputyOptions} 
                        value={selectedDeputies}
                        onChange={(selected) => setClassForm({...classForm, deputyIds: selected ? selected.map(s => s.value) : []})}
                        placeholder="Tìm kiếm và chọn lớp phó..."
                        noOptionsMessage={() => "Không tìm thấy kết quả"}
                        styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                        menuPortalTarget={document.body}
                        menuPosition="fixed"
                      />
                    </div>
                  </>
                );
              })()}
              <Select label="Trạng thái" value={classForm.status} onChange={(e) => setClassForm({...classForm, status: Number(e.target.value)})}>
                <option value={1}>Đang hoạt động</option>
                <option value={0}>Vô hiệu hóa</option>
              </Select>
            </div>
          </Modal>
        )
      })()}
    
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
                  await client.put(`/directory/users/${form.id}`, form);
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

            {["STUDENT", "DEAN", "CLASS_LEADER", "CLASS_DEPUTY"].includes(form.role) && (
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
      )}
    </>
  )
}
