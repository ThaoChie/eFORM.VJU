import toast from "react-hot-toast";
import { AlertTriangle, CircleOff, CheckCircle, Download, Pencil, Plus, Search, Settings, Upload, ChevronLeft, ChevronRight, Filter, ChevronDown, ChevronUp } from "lucide-react"
import { useEffect, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { Button, Card, IconButton, Input, Modal, PageTitle, Select, Table, ResetFilterButton, Pagination } from "../../../components/ui/Primitives"
import { useDirectoryStore } from "../../../stores/useDirectoryStore"
import ReactSelect from "react-select";
import { downloadBlob, downloadExcelTemplate } from "../../../lib/downloadHelper";

const tabs = [
  ["departments", "Khoa"],
  ["majors", "Ngành"],
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
  const [majors, setMajors] = useState([]);
  const [students, setStudents] = useState([]);
  const [offices, setOffices] = useState([]);
  const [classes, setClasses] = useState([]);
  
  const [filters, setFilters] = useState({ query: "", status: "Tất cả" });
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
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
  }, [filters]);

  useEffect(() => {
    setFilters({ query: "", status: "Tất cả", major: "", dept: "", cohort: "", role: "", deptSearch: "" });
    setShowFilters(false);
  }, [active]);

  useEffect(() => {
    fetchItems(active);
    if (active === "majors") {
      import("../../../lib/axios/client").then(({ client }) => {
        client.get("/departments").then(res => setDepartments(res || []));
      });
    }
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
        client.get("/majors").then(res => setMajors(Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : [])));
        client.get("/offices").then(res => setOffices(res || []));
        client.get("/classes").then(res => setClasses(res || []));
      });
    }
    if (active === "classes") {
      import("../../../lib/axios/client").then(({ client }) => {
        client.get("/departments").then(res => setDepartments(res || []));
        client.get("/majors").then(res => setMajors(Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : [])));
        client.get("/directory/users?role=STUDENT").then(res => setStudents(res || []));
      });
    }
  }, [active, fetchItems]);

  const renderStatus = (status) => {
    const isActive = status === "Đang hoạt động" || status === 1;
    return (
      <div className="inline-flex items-center gap-1.5 text-xs">
        <span className={`size-1.5 rounded-full shrink-0 ${isActive ? "bg-emerald-500" : "bg-rose-500"}`} />
        <span className={isActive ? "font-medium text-emerald-700" : "font-medium text-rose-700"}>
          {isActive ? "Đang hoạt động" : "Vô hiệu hóa"}
        </span>
      </div>
    );
  };

  const actionButtons = (r) => {
    const isActive = r.status === "Đang hoạt động" || r.status === 1;
    return (
      <div className="flex items-center justify-center gap-1">
        {isActive && (
          <IconButton label="Sửa" onClick={() => {
            if (active === "departments") {
              setForm({
                mode: 'edit',
                id: r.id,
                deptCode: r.deptCode || r.code,
                deptName: r.deptName || r.name,
                status: r.rawStatus !== undefined ? r.rawStatus : 1,
              });
            } else if (active === "majors") {
              setForm({
                mode: 'edit',
                id: r.id,
                majorCode: r.majorCode || r.code,
                majorName: r.majorName || r.name,
                deptId: r.deptId || "",
                status: r.rawStatus !== undefined ? r.rawStatus : 1,
              });
            } else if (active === "offices") {
              setForm({
                mode: 'edit',
                id: r.id,
                officeCode: r.officeCode || r.code,
                officeName: r.officeName || r.name,
                status: r.status !== undefined ? (r.status === "Đang hoạt động" || r.status === 1 ? 1 : 0) : 1,
              });
            } else {
              setForm({ mode: 'edit', ...r });
            }
          }}>
            <Pencil className="size-4" />
          </IconButton>
        )}
        {isActive ? (
          <IconButton label="Vô hiệu hóa" tooltipAlign="right" onClick={async () => {
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
          <IconButton label="Kích hoạt" tooltipAlign="right" onClick={async () => {
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
  };

  let columns = [];
  let rows = [];

  if (active === "departments") {
    columns = [
      { key: "stt", title: "STT", render: (_, i) => i + 1 },
      { key: "code", title: "Mã Khoa", render: (r) => <span className="font-mono text-xs text-slate-700">{r.code}</span> },
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
      deptCode: item.deptCode,
      deptName: item.deptName,
      dean: item.deanName || "Chưa chỉ định",
      deanId: item.deanId,
      classesCount: item.classesCount ?? item.classCount ?? 0,
      status: item.status === 1 ? "Đang hoạt động" : "Vô hiệu hóa",
      rawStatus: item.status,
    }));
  } else if (active === "majors") {
    columns = [
      { key: "stt", title: "STT", render: (_, i) => i + 1 },
      { key: "code", title: "Mã Ngành", render: (r) => <span className="font-mono text-xs text-slate-700">{r.code}</span> },
      { key: "name", title: "Tên Ngành" },
      { key: "department", title: "Khoa trực thuộc", render: (r) => (
        <div className="leading-tight">
          <div className="font-medium">{r.deptName || "Chưa gắn khoa"}</div>
          {r.deptCode && <div className="text-xs text-muted font-mono">{r.deptCode}</div>}
        </div>
      )},
      { key: "status", title: "Trạng thái", render: (r) => renderStatus(r.status) },
      { key: "action", title: "Thao tác", render: actionButtons },
    ];
    rows = items.map((item) => ({
      id: item.id,
      code: item.majorCode,
      name: item.majorName,
      majorCode: item.majorCode,
      majorName: item.majorName,
      deptId: item.deptId,
      deptCode: item.deptCode,
      deptName: item.deptName,
      status: item.status === 1 ? "Đang hoạt động" : "Vô hiệu hóa",
      rawStatus: item.status,
    }));
  } else if (active === "classes") {
    columns = [
      { key: "stt", title: "STT", render: (_, i) => i + 1 },
      { key: "code", title: "Mã lớp", render: (r) => <span className="font-mono text-xs text-slate-700">{r.code}</span> },
      { key: "name", title: "Tên lớp" },
      { key: "academicCohort", title: "Niên khóa" },
      { key: "major", title: "Ngành", render: (r) => (
        <div className="leading-tight">
          <div className="font-medium">{r.majorName || "Chưa gắn ngành"}</div>
          {r.majorCode && <div className="text-xs text-muted font-mono">{r.majorCode}</div>}
        </div>
      )},
      { key: "department", title: "Khoa", render: (r) => (
        <div className="leading-tight">
          <div className="font-medium">{r.deptName || "Chưa gắn khoa"}</div>
          {r.deptCode && <div className="text-xs text-muted font-mono">{r.deptCode}</div>}
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
            <IconButton label="Sửa" onClick={() => setClassForm({
              mode: 'edit',
              id: r.id,
              majorId: r.majorId || "",
              deptId: r.deptId || "",
              classCode: r.code,
              className: r.name,
              academicCohort: r.academicCohort || "",
              leaderIds: r.leaders?.map(l=>l.id) || [],
              deputyIds: r.deputies?.map(l=>l.id) || [],
              status: r.status
            })}>
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
      majorId: item.majorId,
      majorCode: item.majorCode,
      majorName: item.majorName,
      deptId: item.deptId,
      deptCode: item.deptCode,
      deptName: item.deptName
    }));
  } else if (active === "users") {
    columns = [
      { key: "stt", title: "STT", render: (_, i) => i + 1 },
      { key: "userCode", title: "Mã người dùng", render: (r) => r.userCode ? <span className="font-mono text-xs text-slate-700">{r.userCode}</span> : <span className="text-muted">—</span> },
      { key: "fullName", title: "Họ và tên", render: (r) => r.fullName || <span className="text-muted">—</span> },
      { key: "dob", title: "Ngày sinh", render: (r) => r.dob || <span className="text-muted">—</span> },
      { key: "email", title: "Email", render: (r) => r.email || <span className="text-muted">—</span> },
      { key: "major", title: "Ngành", render: (r) => r.majorName || <span className="text-muted">—</span> },
      { key: "department", title: "Khoa/Phòng", render: (r) => r.deptName || r.officeName || <span className="text-muted">—</span> },
      { key: "role", title: "Vai trò" },
      { key: "status", title: "Trạng thái", render: (r) => renderStatus(r.status === 1 ? "Đang hoạt động" : "Vô hiệu hóa") },
      { key: "action", title: "Thao tác", render: actionButtons },
    ];
    rows = items.map(item => {
      const cls = classes.find(c => c.id === (item.classId || item.classEntity?.id));
      const majorId = item.majorId || (item.major ? item.major.id : (cls ? cls.majorId : null));
      const majorName = item.majorName || (item.major ? item.major.majorName : (cls ? cls.majorName : ""));
      const deptId = item.departmentId || item.deptId || (item.department ? item.department.id : (cls ? cls.deptId : null));
      const cohort = item.academicCohort || (item.classEntity ? item.classEntity.academicCohort : (cls ? cls.academicCohort : ""));
      return {
        ...item,
        dob: item.dob || "",
        majorId: majorId,
        majorName: majorName,
        departmentId: deptId,
        deptId: deptId,
        classId: item.classId || (item.classEntity ? item.classEntity.id : null),
        officeId: item.officeId || (item.office ? item.office.id : null),
        userCode: item.userCode || item.code || "",
        fullName: item.fullName || item.name || "",
        email: item.email || "",
        role: item.role || "STUDENT",
        status: item.status !== undefined ? item.status : 1,
        deptName: item.deptName || (item.department ? item.department.deptName : (cls ? cls.deptName : "")),
        deptCode: item.deptCode || (item.department ? item.department.deptCode : (cls ? cls.deptCode : "")),
        officeName: item.office ? item.office.officeName : "",
        officeCode: item.office ? item.office.officeCode : "",
        className: item.className || (item.classEntity ? item.classEntity.className : (cls ? (cls.className || cls.name) : "")),
        classCode: item.classCode || (item.classEntity ? item.classEntity.classCode : (cls ? (cls.classCode || cls.code) : "")),
        academicCohort: cohort
      };
    });
  } else if (active === "offices") {
    columns = [
      { key: "stt", title: "STT", render: (_, i) => i + 1 },
      { key: "code", title: "Mã phòng ban", render: (r) => <span className="font-mono text-xs text-slate-700">{r.code}</span> },
      { key: "name", title: "Tên phòng ban" },
      { key: "head", title: "Trưởng phòng", render: (r) => r.headName || "Chưa chỉ định" },
      { key: "status", title: "Trạng thái", render: (r) => renderStatus(r.status === 1 ? "Đang hoạt động" : "Vô hiệu hóa") },
      { key: "action", title: "Thao tác", render: actionButtons },
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

  const handleResetFilters = () => {
    setFilters({ query: "", status: "Tất cả", major: "", dept: "", cohort: "", role: "", deptSearch: "" });
  };

  const renderFilters = () => {
    if (active === "departments") {
      rows = rows.filter(r => {
        const itemStatus = (r.status === 1 || r.status === "Đang hoạt động") ? "Đang hoạt động" : "Vô hiệu hóa";
        if (filters.status && filters.status !== "Tất cả" && itemStatus !== filters.status) return false;
        if (filters.query) {
          const q = filters.query.trim().toLowerCase();
          return r.code?.toLowerCase().includes(q) || r.name?.toLowerCase().includes(q) || r.dean?.toLowerCase().includes(q);
        }
        return true;
      });
    } else if (active === "majors") {
      rows = rows.filter(r => {
        const itemStatus = (r.status === 1 || r.status === "Đang hoạt động") ? "Đang hoạt động" : "Vô hiệu hóa";
        if (filters.status && filters.status !== "Tất cả" && itemStatus !== filters.status) return false;
        if (filters.dept && r.deptId !== Number(filters.dept)) return false;
        if (filters.query) {
          const q = filters.query.trim().toLowerCase();
          return r.code?.toLowerCase().includes(q) || r.name?.toLowerCase().includes(q) || r.deptName?.toLowerCase().includes(q);
        }
        return true;
      });
    } else if (active === "offices") {
      rows = rows.filter(r => {
        const itemStatus = (r.status === 1 || r.status === "Đang hoạt động") ? "Đang hoạt động" : "Vô hiệu hóa";
        if (filters.status && filters.status !== "Tất cả" && itemStatus !== filters.status) return false;
        if (filters.query) {
          const q = filters.query.trim().toLowerCase();
          return r.code?.toLowerCase().includes(q) || r.name?.toLowerCase().includes(q) || r.headName?.toLowerCase().includes(q);
        }
        return true;
      });
    } else if (active === "classes") {
      rows = rows.filter(r => {
        const itemStatus = (r.status === 1 || r.status === "Đang hoạt động") ? "Đang hoạt động" : "Vô hiệu hóa";
        if (filters.status && filters.status !== "Tất cả" && itemStatus !== filters.status) return false;
        if (filters.major && r.majorId !== Number(filters.major)) return false;
        if (filters.dept && r.deptId !== Number(filters.dept)) return false;
        if (filters.cohort && r.academicCohort && !r.academicCohort.toLowerCase().includes(filters.cohort.trim().toLowerCase())) return false;
        if (filters.query) {
          const q = filters.query.trim().toLowerCase();
          return r.code?.toLowerCase().includes(q) || r.name?.toLowerCase().includes(q) || r.majorName?.toLowerCase().includes(q) || r.deptName?.toLowerCase().includes(q);
        }
        return true;
      });
    } else if (active === "users") {
      rows = rows.filter(r => {
        const itemStatus = (r.status === 1 || r.status === "Đang hoạt động") ? "Đang hoạt động" : "Vô hiệu hóa";
        if (filters.status && filters.status !== "Tất cả" && itemStatus !== filters.status) return false;
        if (filters.role && r.role !== filters.role) return false;
        if (filters.major && r.majorId !== Number(filters.major)) return false;
        if (filters.query) {
          const q = filters.query.trim().toLowerCase();
          return r.userCode?.toLowerCase().includes(q) || r.fullName?.toLowerCase().includes(q) || r.email?.toLowerCase().includes(q);
        }
        if (filters.deptSearch) {
          const dq = filters.deptSearch.trim().toLowerCase();
          return r.deptCode?.toLowerCase().includes(dq) || r.deptName?.toLowerCase().includes(dq) || r.officeCode?.toLowerCase().includes(dq) || r.officeName?.toLowerCase().includes(dq);
        }
        return true;
      });
    }

    let extraFilterCount = 0;
    if (filters.status && filters.status !== "Tất cả") extraFilterCount++;
    if (active === "majors") {
      if (filters.dept) extraFilterCount++;
    } else if (active === "classes") {
      if (filters.major) extraFilterCount++;
      if (filters.dept) extraFilterCount++;
      if (filters.cohort) extraFilterCount++;
    } else if (active === "users") {
      if (filters.role) extraFilterCount++;
      if (filters.major) extraFilterCount++;
      if (filters.deptSearch) extraFilterCount++;
    }

    const renderCollapsibleFilters = () => {
      if (active === "departments" || active === "offices") {
        return (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
            <Select
              label="Trạng thái"
              value={filters.status || "Tất cả"}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            >
              <option>Tất cả</option>
              <option>Đang hoạt động</option>
              <option>Vô hiệu hóa</option>
            </Select>
          </div>
        );
      }
      if (active === "majors") {
        return (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
            <Select
              label="Khoa trực thuộc"
              value={filters.dept || ""}
              onChange={(e) => setFilters(prev => ({ ...prev, dept: e.target.value }))}
            >
              <option value="">Tất cả Khoa (Mã - Tên)</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.deptCode} - {d.deptName}</option>
              ))}
            </Select>
            <Select
              label="Trạng thái"
              value={filters.status || "Tất cả"}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            >
              <option>Tất cả</option>
              <option>Đang hoạt động</option>
              <option>Vô hiệu hóa</option>
            </Select>
          </div>
        );
      }
      if (active === "classes") {
        return (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
            <Select
              label="Ngành"
              value={filters.major || ""}
              onChange={(e) => setFilters(prev => ({ ...prev, major: e.target.value }))}
            >
              <option value="">Tất cả Ngành</option>
              {majors.map(m => (
                <option key={m.id} value={m.id}>{m.majorCode} - {m.majorName}</option>
              ))}
            </Select>
            <Select
              label="Khoa"
              value={filters.dept || ""}
              onChange={(e) => setFilters(prev => ({ ...prev, dept: e.target.value }))}
            >
              <option value="">Tất cả Khoa (Mã - Tên)</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.deptCode} - {d.deptName}</option>
              ))}
            </Select>
            <Input
              label="Niên khóa"
              placeholder="Nhập niên khoá (ví dụ: 2023-2027)"
              value={filters.cohort || ""}
              onChange={(e) => setFilters(prev => ({ ...prev, cohort: e.target.value }))}
            />
            <Select
              label="Trạng thái"
              value={filters.status || "Tất cả"}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            >
              <option>Tất cả</option>
              <option>Đang hoạt động</option>
              <option>Vô hiệu hóa</option>
            </Select>
          </div>
        );
      }
      if (active === "users") {
        return (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
            <Select
              label="Vai trò"
              value={filters.role || ""}
              onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value }))}
            >
              <option value="">Tất cả vai trò</option>
              <option value="ADMIN">Quản trị viên</option>
              <option value="STUDENT">Sinh viên</option>
              <option value="CLASS_LEADER">Lớp trưởng</option>
              <option value="CLASS_DEPUTY">Lớp phó</option>
              <option value="DEAN">Trưởng khoa</option>
            </Select>
            <Select
              label="Ngành"
              value={filters.major || ""}
              onChange={(e) => setFilters(prev => ({ ...prev, major: e.target.value }))}
            >
              <option value="">Tất cả Ngành</option>
              {majors.map(m => (
                <option key={m.id} value={m.id}>{m.majorCode} - {m.majorName}</option>
              ))}
            </Select>
            <Input
              label="Khoa / Phòng ban"
              placeholder="Tìm theo tên hoặc mã khoa..."
              value={filters.deptSearch || ""}
              onChange={(e) => setFilters(prev => ({ ...prev, deptSearch: e.target.value }))}
            />
            <Select
              label="Trạng thái"
              value={filters.status || "Tất cả"}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            >
              <option>Tất cả</option>
              <option>Đang hoạt động</option>
              <option>Vô hiệu hóa</option>
            </Select>
          </div>
        );
      }
      return null;
    };

    return (
      <Card className="mb-4">
        {/* Hàng tìm kiếm chính */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Input
              placeholder={active === "users" ? "Tìm kiếm theo tên, mã hoặc email..." : "Tìm kiếm theo tên hoặc mã..."}
              value={filters.query || ""}
              onChange={(e) => setFilters(prev => ({ ...prev, query: e.target.value }))}
              className="w-full"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
            <Button variant="primary" type="button">
              <Search className="size-4" />
              Tìm kiếm
            </Button>
            <ResetFilterButton onClick={handleResetFilters} />
            <Button
              variant={showFilters ? "primary" : "secondary"}
              onClick={() => setShowFilters(prev => !prev)}
              type="button"
              className="gap-2"
            >
              <Filter className="size-4" />
              Bộ lọc
              {extraFilterCount > 0 && (
                <span className={`inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-xs font-semibold ${showFilters ? 'bg-white text-brand' : 'bg-brand/10 text-brand'}`}>
                  {extraFilterCount}
                </span>
              )}
              {showFilters ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            </Button>
          </div>
        </div>

        {/* Khối bộ lọc mở rộng xổ ra khi ấn nút Bộ lọc */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-line animate-in fade-in slide-in-from-top-1 duration-200">
            {renderCollapsibleFilters()}
          </div>
        )}
      </Card>
    );
  };

  const exportToExcel = (visibleColumns, data, fileName) => {
    let tableHtml = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8"/>
      <style>
        table { border-collapse: collapse; font-family: sans-serif; }
        th { background-color: #0b6bc7; color: #ffffff; border: 1px solid #cccccc; padding: 8px 12px; font-weight: bold; text-align: center; }
        td { border: 1px solid #cccccc; padding: 6px 10px; text-align: left; }
      </style>
    </head>
    <body>
      <table>
        <thead>
          <tr>
            ${visibleColumns.map(col => `<th>${col.title.replace(" *", "")}</th>`).join("")}
          </tr>
        </thead>
        <tbody>
          ${data.map((row, idx) => `
            <tr>
              ${visibleColumns.map(col => {
                let val = "";
                if (col.key === "stt") val = idx + 1;
                else if (col.key === "status") val = row.status === 1 || row.status === "Đang hoạt động" ? "Đang hoạt động" : "Vô hiệu hóa";
                else if (col.key === "code") val = row.code || row.deptCode || row.classCode || row.officeCode || "";
                else if (col.key === "name") val = row.name || row.deptName || row.className || row.officeName || "";
                else if (col.key === "dean") val = row.dean || row.deanName || "Chưa chỉ định";
                else if (col.key === "classesCount") val = row.classesCount ?? row.classCount ?? 0;
                else if (col.key === "usersCount") val = row.usersCount || 0;
                else if (col.key === "head") val = row.headName || "Chưa chỉ định";
                else if (col.key === "userCode") val = row.userCode || row.code || "";
                else if (col.key === "fullName") val = row.fullName || row.name || "";
                else if (col.key === "email") val = row.email || "";
                else if (col.key === "role") val = row.role || "";
                else if (col.key === "department") val = row.deptName || row.officeName || "";
                else if (col.key === "academicCohort") val = row.academicCohort || "";
                else if (col.key === "leader") val = row.leaders?.map(l => l.fullName).join(", ") || "Chưa chỉ định";
                else if (col.key === "deputy") val = row.deputies?.map(l => l.fullName).join(", ") || "Chưa có";
                else if (col.key === "studentsCount") val = row.studentCount || 0;
                else val = row[col.key] ?? "";
                return `<td>${String(val).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</td>`;
              }).join("")}
            </tr>
          `).join("")}
        </tbody>
      </table>
    </body>
    </html>`;

    const blob = new Blob([tableHtml], { type: "application/vnd.ms-excel;charset=utf-8" });
    downloadBlob(blob, `${fileName}.xls`);
  };

  const handleExportExcel = () => {
    const visibleCols = columns.filter(c => !hiddenCols[c.key] && c.key !== "action");
    if (visibleCols.length === 0) {
      toast.error("Không có cột nào được hiển thị để xuất!");
      return;
    }
    const tabNames = {
      departments: "Danh_sach_Khoa",
      majors: "Danh_sach_Nganh",
      offices: "Danh_sach_Phong_ban",
      classes: "Danh_sach_Lop",
      users: "Danh_sach_Nguoi_dung"
    };
    exportToExcel(visibleCols, rows, tabNames[active] || "Danh_sach");
  };

  const handleDownloadTemplate = async () => {
    try {
      const { client } = await import("../../../lib/axios/client");
      await downloadExcelTemplate(active, client);
      toast.success("Tải file mẫu thành công!");
    } catch (e) {
      console.error("Lỗi tải file mẫu:", e);
      toast.error("Không thể tải file mẫu");
    }
  };

  const renderToolbar = () => {
    if (active === "classes" || active === "departments" || active === "majors" || active === "users" || active === "offices") {
      return (
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setColConfig(true)}>
            <Settings className="size-4" /> Cấu hình cột
          </Button>
          <Button onClick={handleExportExcel}>
            <Download className="size-4" /> Xuất Excel
          </Button>
          <Button onClick={handleDownloadTemplate}>
            <Download className="size-4" /> Tải file mẫu
          </Button>
          <Button onClick={() => {
            setSelectedFile(null);
            setImportData(null);
            setImportExcel(true);
          }}>
            <Upload className="size-4" /> Thêm mới theo lô
          </Button>
          {active === "classes" ? (
            <Button variant="primary" onClick={() => setClassForm({ mode: 'create', majorId: "", deptId: "", classCode: "", className: "", academicCohort: "", leaderIds: [], deputyIds: [], status: 1 })}>
              <Plus className="size-4" /> Thêm mới
            </Button>
          ) : active === "users" ? (
            <Button variant="primary" onClick={() => setForm({ mode: 'create', role: 'STUDENT', majorId: "", dob: "", status: 1 })}>
              <Plus className="size-4" /> Thêm mới
            </Button>
          ) : active === "departments" ? (
            <Button variant="primary" onClick={() => setForm({ mode: 'create', deptCode: "", deptName: "", status: 1 })}>
              <Plus className="size-4" /> Thêm mới
            </Button>
          ) : active === "majors" ? (
            <Button variant="primary" onClick={() => setForm({ mode: 'create', majorCode: "", majorName: "", deptId: "", status: 1 })}>
              <Plus className="size-4" /> Thêm mới
            </Button>
          ) : active === "offices" ? (
            <Button variant="primary" onClick={() => setForm({ mode: 'create', officeCode: "", officeName: "", status: 1 })}>
              <Plus className="size-4" /> Thêm mới
            </Button>
          ) : (
            <Button variant="primary" onClick={() => setForm({ mode: 'create' })}>
              <Plus className="size-4" /> Thêm mới
            </Button>
          )}
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
        const totalPages = Math.ceil(rows.length / pageSize) || 1;
        const currentData = rows.slice((page - 1) * pageSize, page * pageSize);
        return (
          <Card className="p-0">
            <Table columns={columns.filter(c => !hiddenCols[c.key])} rows={currentData} loading={loading} emptyMessage="Không có dữ liệu danh mục" />
            <Pagination
              currentPage={page}
              pageSize={pageSize}
              totalItems={rows.length}
              pageSizeOptions={[10, 25, 50]}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          </Card>
        );
      })()}

      {active === "offices" && form && (
        <Modal 
          open={true} 
          title={form.mode === 'edit' ? "Chỉnh sửa Phòng ban" : "Thêm mới Phòng ban"} 
          onClose={() => setForm(false)} 
          footer={
            <>
              <Button onClick={() => setForm(false)}>Hủy</Button>
              <Button variant="primary" onClick={async () => {
                try {
                  const { client } = await import("../../../lib/axios/client");
                  const code = form.officeCode || form.code;
                  const name = form.officeName || form.name;
                  if (!name?.trim()) return toast.error("Vui lòng nhập tên phòng ban");
                  if (form.mode === 'create' && !code?.trim()) return toast.error("Vui lòng nhập mã phòng ban");

                  const payload = {
                    officeCode: code?.trim(),
                    officeName: name?.trim(),
                    status: form.status !== undefined ? Number(form.status) : 1
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
          }
        >
          <div className="space-y-4">
            <Input 
              label={form.mode === 'edit' ? "Mã phòng ban" : "Mã phòng ban *"} 
              placeholder="Nhập mã phòng ban" 
              value={form.officeCode || form.code || ""} 
              onChange={e => setForm({...form, officeCode: e.target.value})} 
              disabled={form.mode === 'edit'} 
            />
            <Input 
              label="Tên phòng ban *" 
              placeholder="Nhập tên phòng ban" 
              value={form.officeName || form.name || ""} 
              onChange={e => setForm({...form, officeName: e.target.value})} 
            />
            <Select 
              label="Trạng thái" 
              value={form.status !== undefined ? form.status : 1} 
              onChange={e => setForm({...form, status: Number(e.target.value)})}
            >
              <option value={1}>Đang hoạt động</option>
              <option value={0}>Vô hiệu hóa</option>
            </Select>
          </div>
        </Modal>
      )}
    
      {active === "departments" && form && (
        <Modal 
          open={true} 
          title={form.mode === 'edit' ? "Chỉnh sửa Khoa" : "Thêm mới Khoa"} 
          onClose={() => setForm(false)} 
          footer={
            <>
              <Button onClick={() => setForm(false)}>Hủy</Button>
              <Button variant="primary" onClick={async () => {
                try {
                  const { client } = await import("../../../lib/axios/client");
                  const code = form.deptCode || form.code;
                  const name = form.deptName || form.name;
                  if (!name?.trim()) return toast.error("Vui lòng nhập tên khoa");
                  if (form.mode === 'create' && !code?.trim()) return toast.error("Vui lòng nhập mã khoa");

                  const payload = {
                    deptCode: code?.trim(),
                    deptName: name?.trim(),
                    status: form.status !== undefined ? Number(form.status) : 1
                  };

                  if (form.mode === 'create') {
                    await client.post("/departments", payload);
                    toast.success("Tạo Khoa thành công!");
                  } else {
                    await client.put(`/departments/${form.id}`, payload);
                    toast.success("Cập nhật Khoa thành công!");
                  }
                  setForm(false);
                  fetchItems(active);
                } catch (e) {
                  toast.error(e.response?.data?.message || "Lỗi xử lý Khoa");
                }
              }}>Lưu</Button>
            </>
          }
        >
          <div className="space-y-4">
            <Input 
              label={form.mode === 'edit' ? "Mã khoa" : "Mã khoa *"} 
              placeholder="Nhập mã khoa" 
              value={form.deptCode || form.code || ""} 
              onChange={e => setForm({...form, deptCode: e.target.value})} 
              disabled={form.mode === 'edit'} 
            />
            <Input 
              label="Tên khoa *" 
              placeholder="Nhập tên khoa" 
              value={form.deptName || form.name || ""} 
              onChange={e => setForm({...form, deptName: e.target.value})} 
            />
            <Select 
              label="Trạng thái" 
              value={form.status !== undefined ? form.status : (form.statusStr === 'Vô hiệu hóa' ? 0 : 1)} 
              onChange={e => setForm({...form, status: Number(e.target.value)})}
            >
              <option value={1}>Đang hoạt động</option>
              <option value={0}>Vô hiệu hóa</option>
            </Select>
          </div>
        </Modal>
      )}

      {active === "majors" && form && (
        <Modal 
          open={true} 
          title={form.mode === 'edit' ? "Chỉnh sửa Ngành" : "Thêm mới Ngành"} 
          onClose={() => setForm(false)} 
          footer={
            <>
              <Button onClick={() => setForm(false)}>Hủy</Button>
              <Button variant="primary" onClick={async () => {
                try {
                  const { client } = await import("../../../lib/axios/client");
                  const code = form.majorCode || form.code;
                  const name = form.majorName || form.name;
                  const deptId = form.deptId;
                  if (!code?.trim()) return toast.error("Vui lòng nhập mã ngành");
                  if (!name?.trim()) return toast.error("Vui lòng nhập tên ngành");
                  if (!deptId) return toast.error("Vui lòng chọn khoa trực thuộc");

                  const payload = {
                    majorCode: code?.trim(),
                    majorName: name?.trim(),
                    deptId: Number(deptId),
                    status: form.status !== undefined ? Number(form.status) : 1
                  };

                  if (form.mode === 'create') {
                    await client.post("/majors", payload);
                    toast.success("Tạo Ngành thành công!");
                  } else {
                    await client.put(`/majors/${form.id}`, payload);
                    toast.success("Cập nhật Ngành thành công!");
                  }
                  setForm(false);
                  fetchItems(active);
                } catch (e) {
                  toast.error(e.response?.data?.message || "Lỗi xử lý Ngành");
                }
              }}>Lưu</Button>
            </>
          }
        >
          <div className="space-y-4">
            <Input 
              label={form.mode === 'edit' ? "Mã ngành (Cố định)" : "Mã ngành *"} 
              placeholder="Nhập mã ngành (ví dụ: CNTT, KHMT, CNKT...)" 
              value={form.majorCode || form.code || ""} 
              onChange={e => setForm({...form, majorCode: e.target.value})} 
              disabled={form.mode === 'edit'} 
            />
            <Input 
              label="Tên ngành *" 
              placeholder="Nhập tên ngành (ví dụ: Công nghệ Thông tin...)" 
              value={form.majorName || form.name || ""} 
              onChange={e => setForm({...form, majorName: e.target.value})} 
            />
            <Select 
              label="Khoa trực thuộc *" 
              value={form.deptId || ""} 
              onChange={e => setForm({...form, deptId: e.target.value})}
            >
              <option value="">-- Chọn Khoa trực thuộc --</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>
                  {d.deptCode} - {d.deptName}
                </option>
              ))}
            </Select>
            <Select 
              label="Trạng thái" 
              value={form.status !== undefined ? form.status : (form.statusStr === 'Vô hiệu hóa' ? 0 : 1)} 
              onChange={e => setForm({...form, status: Number(e.target.value)})}
            >
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

      <Modal 
        open={importExcel} 
        wide={importData !== null} 
        title={`Thêm mới theo lô - ${tabs.find(t => t[0] === active)?.[1] || active}`} 
        onClose={() => { setImportExcel(false); setImportData(null); setSelectedFile(null); }} 
        footer={
          <>
            <Button onClick={() => { setImportExcel(false); setImportData(null); setSelectedFile(null); }}>Hủy</Button>
            {importData ? (
               <>
                 <Button variant="secondary" onClick={() => setImportData(null)}>
                   Chọn lại file
                 </Button>
                 <Button variant="primary" loading={importing} disabled={!importData || importData.validRows === 0} onClick={async () => {
                   setImporting(true);
                   try {
                     const { directoryService } = await import("../../../services/directory-service");
                     let res;
                     if (active === "classes") {
                       res = await directoryService.importClasses(selectedFile, false);
                     } else if (active === "majors") {
                       res = await directoryService.importMajors(selectedFile, false);
                     } else if (active === "offices") {
                       res = await directoryService.importOffices(selectedFile, false);
                     } else if (active === "users") {
                       res = await directoryService.importUsers(selectedFile, false);
                     } else {
                       res = await directoryService.importDepartments(selectedFile, false);
                     }
                     const count = res?.data?.validRows ?? importData.validRows;
                     toast.success(`Nhập dữ liệu thành công (${count} dòng)!`);
                     setImportExcel(false);
                     setImportData(null);
                     setSelectedFile(null);
                     fetchItems(active);
                   } catch (err) {
                     toast.error(err.response?.data?.message || err.message || "Có lỗi xảy ra khi nhập dữ liệu!");
                   } finally {
                     setImporting(false);
                   }
                 }}>Xác nhận Nhập ({importData.validRows} dòng)</Button>
               </>
            ) : (
               <Button variant="primary" disabled={!selectedFile} loading={importing} onClick={async () => {
                 setImporting(true);
                 try {
                   const { directoryService } = await import("../../../services/directory-service");
                   let res;
                   if (active === "classes") {
                     res = await directoryService.importClasses(selectedFile, true);
                   } else if (active === "majors") {
                     res = await directoryService.importMajors(selectedFile, true);
                   } else if (active === "offices") {
                     res = await directoryService.importOffices(selectedFile, true);
                   } else if (active === "users") {
                     res = await directoryService.importUsers(selectedFile, true);
                   } else {
                     res = await directoryService.importDepartments(selectedFile, true);
                   }
                   setImportData(res?.data || res);
                 } catch (err) {
                   toast.error(err.response?.data?.message || err.message || "Lỗi đọc file Excel!");
                 } finally {
                   setImporting(false);
                 }
               }}>Xem trước dữ liệu</Button>
            )}
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg bg-slate-50 border border-line p-3">
            <div className="text-sm">
              <span className="font-medium text-ink">File mẫu dữ liệu chuẩn:</span>
              <p className="text-xs text-muted mt-0.5">Tải template mẫu chuẩn (.xlsx) để điền đúng định dạng các cột</p>
            </div>
            <Button
              variant="secondary"
              onClick={handleDownloadTemplate}
              className="shrink-0 text-xs h-8 px-3"
            >
              <Download className="size-3.5" /> Tải file mẫu
            </Button>
          </div>

          {!importData ? (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files?.length > 0) {
                  setSelectedFile(e.dataTransfer.files[0]);
                }
              }}
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.xlsx, .xls';
                input.onchange = (e) => {
                  if (e.target.files.length > 0) setSelectedFile(e.target.files[0]);
                };
                input.click();
              }}
              className={`rounded-lg border-2 border-dashed p-8 text-center cursor-pointer transition ${
                selectedFile ? 'border-brand bg-brand-soft' : 'border-line hover:bg-canvas'
              }`}
            >
              <Upload className={`size-8 mx-auto mb-3 ${selectedFile ? 'text-brand' : 'text-muted'}`} />
              {selectedFile ? (
                <div>
                  <p className="font-semibold text-brand text-sm">{selectedFile.name}</p>
                  <p className="text-xs text-muted mt-1">
                    Dung lượng: {(selectedFile.size / 1024).toFixed(1)} KB — Click để đổi file khác
                  </p>
                </div>
              ) : (
                <div>
                  <p className="font-medium text-ink text-sm">Click để chọn file từ máy tính</p>
                  <p className="text-xs text-muted mt-1">hoặc kéo thả file Excel (.xlsx) vào đây</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-emerald-50 text-emerald-800 p-4 rounded-lg border border-emerald-200">
                  <p className="text-xs uppercase font-semibold text-emerald-600">Số dòng hợp lệ</p>
                  <p className="text-2xl font-bold mt-1">{importData.validRows}</p>
                </div>
                <div className={`p-4 rounded-lg border ${
                  importData.invalidRows > 0 
                    ? 'bg-rose-50 text-rose-800 border-rose-200' 
                    : 'bg-slate-50 text-slate-600 border-line'
                }`}>
                  <p className={`text-xs uppercase font-semibold ${
                    importData.invalidRows > 0 ? 'text-rose-600' : 'text-muted'
                  }`}>Số dòng lỗi</p>
                  <p className="text-2xl font-bold mt-1">{importData.invalidRows}</p>
                </div>
              </div>

              {importData.invalidRows > 0 ? (
                <div className="rounded-lg border border-rose-200 bg-rose-50/50 p-4">
                  <p className="font-semibold text-sm text-rose-800 mb-2">Chi tiết lỗi ({importData.errors?.length || 0}):</p>
                  <ul className="list-disc pl-5 space-y-1 text-xs text-rose-700 max-h-48 overflow-y-auto">
                    {importData.errors?.map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-4 text-center">
                  <p className="text-sm font-semibold text-emerald-700">
                    Tất cả {importData.validRows} dòng dữ liệu đều hợp lệ!
                  </p>
                  <p className="text-xs text-emerald-600 mt-0.5">
                    Nhấn nút &ldquo;Xác nhận Nhập&rdquo; bên dưới để lưu vào hệ thống.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>

      {classForm && (() => {
        const selectedMajor = majors.find(m => m.id === Number(classForm.majorId));
        const effectiveDeptId = selectedMajor ? selectedMajor.deptId : (classForm.deptId ? Number(classForm.deptId) : null);
        const selectedDept = departments.find(d => d.id === effectiveDeptId) || (selectedMajor ? { deptName: selectedMajor.deptName, deptCode: selectedMajor.deptCode } : null);
        const displayedDeptName = selectedDept 
          ? (selectedDept.deptCode ? `${selectedDept.deptCode} - ${selectedDept.deptName}` : selectedDept.deptName)
          : (selectedMajor ? `${selectedMajor.deptCode || ""} - ${selectedMajor.deptName || ""}`.replace(/^ - /, "") : "");
        const displayedDean = selectedDept?.deanName || "Chưa chỉ định";

        return (
          <Modal open={true} title={classForm.mode === 'edit' ? "Chỉnh sửa Lớp" : "Thêm mới Lớp"} onClose={() => setClassForm(null)} footer={
              <>
                <Button onClick={() => setClassForm(null)}>Hủy</Button>
                <Button variant="primary" onClick={async () => {
                  if (!classForm.majorId && !classForm.deptId) return toast.error("Vui lòng chọn Ngành");
                  if (!classForm.classCode || !classForm.className) return toast.error("Vui lòng nhập đủ Mã lớp, Tên lớp");
                  try {
                    const { client } = await import("../../../lib/axios/client");
                    const payload = {
                      ...classForm,
                      majorId: classForm.majorId ? Number(classForm.majorId) : null,
                      deptId: effectiveDeptId
                    };
                    if (classForm.mode === 'create') {
                      await client.post("/classes", payload);
                      toast.success("Tạo Lớp thành công!");
                    } else {
                      await client.put(`/classes/${classForm.id}`, payload);
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
              <Select 
                label="Ngành *" 
                value={classForm.majorId || ""} 
                onChange={(e) => {
                  const mId = e.target.value;
                  const m = majors.find(item => item.id === Number(mId));
                  setClassForm({
                    ...classForm, 
                    majorId: mId,
                    deptId: m ? m.deptId : classForm.deptId
                  });
                }}
              >
                <option value="">Chọn Ngành</option>
                {majors.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.majorCode} - {m.majorName}
                  </option>
                ))}
              </Select>
              <Input 
                label="Khoa" 
                disabled 
                value={displayedDeptName} 
              />
              <Input label="Mã lớp *" value={classForm.classCode} onChange={(e) => setClassForm({...classForm, classCode: e.target.value})} disabled={classForm.mode === 'edit'} />
              <Input label="Tên lớp *" value={classForm.className} onChange={(e) => setClassForm({...classForm, className: e.target.value})} />
              <Input label="Niên khóa" placeholder="Nhập niên khoá (ví dụ: 2023-2027)" value={classForm.academicCohort || ""} onChange={(e) => setClassForm({...classForm, academicCohort: e.target.value})} />
              <Input label="Trưởng Khoa" disabled value={displayedDean} />
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
    
      {active === "users" && form && (() => {
        const selectedMajor = majors.find(m => m.id === Number(form.majorId));
        const effectiveDeptId = selectedMajor ? selectedMajor.deptId : (form.departmentId || form.deptId ? Number(form.departmentId || form.deptId) : null);
        const userDept = departments.find(d => d.id === effectiveDeptId) || (selectedMajor ? { deptName: selectedMajor.deptName, deptCode: selectedMajor.deptCode } : null);
        const displayedDeptName = userDept 
          ? (userDept.deptCode ? `${userDept.deptCode} - ${userDept.deptName}` : userDept.deptName)
          : (selectedMajor ? `${selectedMajor.deptCode || ""} - ${selectedMajor.deptName || ""}`.replace(/^ - /, "") : "");

        return (
          <Modal open={true} title={form.mode === 'edit' ? "Chỉnh sửa Người dùng" : "Thêm mới Người dùng"} onClose={() => setForm(false)} footer={
            <>
              <Button onClick={() => setForm(false)}>Hủy</Button>
              <Button variant="primary" onClick={async () => {
                if (form.mode === 'create' && !form.userCode?.trim()) return toast.error("Vui lòng nhập mã người dùng");
                if (!form.fullName?.trim() || !form.email?.trim()) return toast.error("Vui lòng nhập tên người dùng và email");
                if (["STUDENT", "CLASS_LEADER", "CLASS_DEPUTY"].includes(form.role || "STUDENT") && !form.classId) {
                  return toast.error("Vui lòng chọn Lớp");
                }
                try {
                  const { client } = await import("../../../lib/axios/client");
                  const payload = {
                    ...form,
                    majorId: form.majorId ? Number(form.majorId) : null,
                    departmentId: effectiveDeptId,
                    deptId: effectiveDeptId,
                    dob: form.dob || null
                  };
                  if (form.mode === 'create') {
                    await client.post("/directory/users", payload);
                    toast.success("Tạo Người dùng thành công!");
                  } else {
                    await client.put(`/directory/users/${form.id}`, payload);
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
              <Input label={form.mode === 'edit' ? "Mã người dùng" : "Mã người dùng *"} value={form.userCode || ""} onChange={e => setForm({...form, userCode: e.target.value})} disabled={form.mode === 'edit'} />
              <Input label="Họ và tên *" value={form.fullName || ""} onChange={e => setForm({...form, fullName: e.target.value})} />
              <Input label="Ngày sinh" type="date" value={form.dob || ""} onChange={e => setForm({...form, dob: e.target.value})} />
              <Input label="Email *" value={form.email || ""} onChange={e => setForm({...form, email: e.target.value})} />
              
              <Select label="Vai trò *" value={form.role || "STUDENT"} onChange={e => setForm({...form, role: e.target.value})}>
                <option value="ADMIN">Quản trị viên (Admin)</option>
                <option value="DEAN">Trưởng khoa</option>
                <option value="CLASS_LEADER">Lớp trưởng</option>
                <option value="CLASS_DEPUTY">Lớp phó</option>
                <option value="STUDENT">Sinh viên</option>
              </Select>

              {["STUDENT", "DEAN", "CLASS_LEADER", "CLASS_DEPUTY"].includes(form.role) && (
                <>
                  <Select 
                    label="Ngành" 
                    value={form.majorId || ""} 
                    onChange={e => {
                      const mId = e.target.value ? Number(e.target.value) : null;
                      const m = majors.find(item => item.id === mId);
                      setForm(prev => ({
                        ...prev, 
                        majorId: mId,
                        departmentId: m?.deptId || prev.departmentId,
                        deptId: m?.deptId || prev.deptId
                      }));
                    }}
                  >
                    <option value="">Chọn Ngành...</option>
                    {majors.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.majorCode} - {m.majorName}
                      </option>
                    ))}
                  </Select>
                  <Input 
                    label="Khoa" 
                    disabled 
                    value={displayedDeptName} 
                  />
                </>
              )}

              {form.role === "ADMIN" && (
                <Select label="Phòng ban" value={form.officeId || ""} onChange={e => {
                  const val = e.target.value ? Number(e.target.value) : null;
                  setForm({...form, officeId: val});
                }}>
                  <option value="">Chọn Phòng ban...</option>
                  {offices.map(o => <option key={o.id} value={o.id}>{o.officeCode || o.code} - {o.officeName || o.name}</option>)}
                </Select>
              )}

              {["STUDENT", "CLASS_LEADER", "CLASS_DEPUTY"].includes(form.role) && (
                <Select label="Lớp *" value={form.classId || ""} onChange={e => {
                  const classId = e.target.value ? Number(e.target.value) : null;
                  const foundClass = classes.find(c => c.id === classId);
                  const classMajor = foundClass?.majorId ? majors.find(m => m.id === foundClass.majorId) : null;
                  setForm(prev => ({
                    ...prev,
                    classId,
                    majorId: foundClass?.majorId || prev.majorId,
                    departmentId: foundClass?.deptId || classMajor?.deptId || prev.departmentId,
                    deptId: foundClass?.deptId || classMajor?.deptId || prev.deptId,
                    academicCohort: foundClass?.academicCohort || prev.academicCohort
                  }));
                }}>
                  <option value="">Chọn Lớp...</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.classCode || c.code} - {c.className || c.name}</option>)}
                </Select>
              )}

              {["STUDENT", "CLASS_LEADER", "CLASS_DEPUTY"].includes(form.role) && (
                <Input label="Niên khóa" placeholder="Nhập niên khoá (ví dụ: 2023-2027)" value={form.academicCohort || ""} onChange={e => setForm({...form, academicCohort: e.target.value})} />
              )}

              <Select label="Trạng thái" value={form.status !== undefined ? form.status : 1} onChange={e => setForm({...form, status: Number(e.target.value)})}>
                <option value={1}>Đang hoạt động</option>
                <option value={0}>Vô hiệu hóa</option>
              </Select>
            </div>
          </Modal>
        );
      })()}
    </>
  )
}
