import { 
  Eye, 
  Pencil, 
  Plus, 
  Search, 
  CircleOff, 
  CheckCircle, 
  FileText, 
  RotateCcw,
  Calendar,
  AlertTriangle,
  ChevronLeft,
  ChevronRight
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"
import { toast } from "react-hot-toast"
import {
  Button,
  Card,
  IconButton,
  Input,
  PageTitle,
  Select,
  Table,
  Modal,
  Textarea
} from "../../../components/ui/Primitives"
import { formService } from "../../../services/form-service"
import { client } from "../../../lib/axios/client"

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const pad = (n) => n.toString().padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  } catch (e) {
    return dateStr;
  }
};

export default function FormVersionListPage() {
  const navigate = useNavigate()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const pageSize = 10

  // Filter options
  const [semesters, setSemesters] = useState([])
  const [departments, setDepartments] = useState([])

  // Search & Filter criteria
  const [filters, setFilters] = useState({
    formQuery: "",
    nameQuery: "",
    status: "",
    scope: "",
    semesterId: ""
  })

  // Modal states
  // 1. Version list modal (Xem chi tiết)
  const [versionModalOpen, setVersionModalOpen] = useState(false)
  const [selectedForm, setSelectedForm] = useState(null)
  const [versionList, setVersionList] = useState([])
  const [loadingVersions, setLoadingVersions] = useState(false)

  // 2. Deactivation modal (Yêu cầu vô hiệu hóa)
  const [deactivateModalOpen, setDeactivateModalOpen] = useState(false)
  const [targetDeactivateItem, setTargetDeactivateItem] = useState(null)
  const [deactivateReason, setDeactivateReason] = useState("")
  const [deactivateError, setDeactivateError] = useState("")
  const [deactivating, setDeactivating] = useState(false)

  // 3. Activation modal (Yêu cầu kích hoạt)
  const [activateModalOpen, setActivateModalOpen] = useState(false)
  const [targetActivateItem, setTargetActivateItem] = useState(null)
  const [activateReason, setActivateReason] = useState("")
  const [activating, setActivating] = useState(false)

  // Fetch initial dropdowns & forms
  const fetchMetadata = async () => {
    try {
      const [semRes, deptRes] = await Promise.allSettled([
        client.get("/semesters"),
        client.get("/departments")
      ]);
      if (semRes.status === "fulfilled" && semRes.value) {
        setSemesters(Array.isArray(semRes.value) ? semRes.value : semRes.value.content || []);
      }
      if (deptRes.status === "fulfilled" && deptRes.value) {
        setDepartments(Array.isArray(deptRes.value) ? deptRes.value : deptRes.value.content || []);
      }
    } catch (e) {
      console.warn("Could not load full metadata dropdowns", e);
    }
  };

  const fetchFormVersions = async () => {
    setLoading(true);
    try {
      const res = await formService.getTemplates();
      const items = Array.isArray(res) ? res : res?.content || res?.data || [];
      setData(items);
    } catch (e) {
      console.error("Error fetching form versions:", e);
      toast.error("Không thể tải danh sách phiên bản biểu mẫu từ máy chủ");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetadata();
    fetchFormVersions();
  }, []);

  // Filter processing
  const filteredData = data.filter((item) => {
    if (filters.formQuery) {
      const q = filters.formQuery.trim().toLowerCase();
      const codeMatch = item.formCode?.toLowerCase().includes(q);
      const nameMatch = item.formName?.toLowerCase().includes(q);
      if (!codeMatch && !nameMatch) return false;
    }
    if (filters.nameQuery) {
      const q = filters.nameQuery.trim().toLowerCase();
      if (!item.formName?.toLowerCase().includes(q)) return false;
    }
    if (filters.status) {
      if (filters.status === "ACTIVE" && item.status !== "ACTIVE") return false;
      if (filters.status === "INACTIVE" && item.status !== "INACTIVE") return false;
      if (filters.status === "EXPIRED" && item.status !== "EXPIRED") return false;
    }
    if (filters.scope && item.scope !== filters.scope) return false;
    if (filters.semesterId && String(item.semesterId) !== String(filters.semesterId)) return false;
    return true;
  });

  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const paginatedData = filteredData.slice((page - 1) * pageSize, page * pageSize);

  // Status badge renderer - Thiết kế phẳng, đơn giản, gọn gàng và không ngắt dòng
  const renderStatusTag = (status) => {
    switch (status) {
      case "ACTIVE":
        return (
          <span className="inline-block whitespace-nowrap rounded-md bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 border border-emerald-200">
            Hiệu lực
          </span>
        );
      case "INACTIVE":
        return (
          <span className="inline-block whitespace-nowrap rounded-md bg-rose-50 px-2.5 py-0.5 text-xs font-medium text-rose-700 border border-rose-200">
            Vô hiệu hóa
          </span>
        );
      case "EXPIRED":
        return (
          <span className="inline-block whitespace-nowrap rounded-md bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 border border-slate-200">
            Hết hiệu lực
          </span>
        );
      default:
        return (
          <span className="inline-block whitespace-nowrap rounded-md bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 border border-amber-200">
            {status || "Bản nháp"}
          </span>
        );
    }
  };

  // Open version history modal
  const handleOpenVersions = async (item) => {
    setSelectedForm(item);
    setVersionModalOpen(true);
    setLoadingVersions(true);
    try {
      const res = await formService.getTemplateVersions(item.id);
      const list = Array.isArray(res) ? res : res?.content || res?.data || [];
      if (list.length > 0) {
        setVersionList(list);
      } else {
        setVersionList([item]);
      }
    } catch (e) {
      setVersionList([item]);
    } finally {
      setLoadingVersions(false);
    }
  };

  // Open deactivate modal
  const handleOpenDeactivate = (item) => {
    setTargetDeactivateItem(item);
    setDeactivateReason("");
    setDeactivateError("");
    setDeactivateModalOpen(true);
  };

  // Confirm deactivate
  const handleConfirmDeactivate = async () => {
    if (!targetDeactivateItem) return;
    setDeactivating(true);
    setDeactivateError("");
    try {
      await formService.deactivateTemplate(targetDeactivateItem.id, deactivateReason);
      toast.success("Vô hiệu hóa phiên bản biểu mẫu thành công!");
      setDeactivateModalOpen(false);
      await fetchFormVersions();
    } catch (err) {
      const errMsg = err?.response?.data?.message || err?.message || "Lỗi khi vô hiệu hóa phiên bản";
      setDeactivateError(errMsg);
      toast.error(errMsg);
    } finally {
      setDeactivating(false);
    }
  };

  // Open activate modal
  const handleOpenActivate = (item) => {
    setTargetActivateItem(item);
    setActivateReason("");
    setActivateModalOpen(true);
  };

  // Confirm activate
  const handleConfirmActivate = async () => {
    if (!targetActivateItem) return;
    setActivating(true);
    try {
      await formService.activateTemplate(targetActivateItem.id, activateReason);
      toast.success("Kích hoạt phiên bản biểu mẫu thành công!");
      setActivateModalOpen(false);
      await fetchFormVersions();
    } catch (err) {
      const errMsg = err?.response?.data?.message || err?.message || "Lỗi khi kích hoạt phiên bản";
      toast.error(errMsg);
    } finally {
      setActivating(false);
    }
  };

  // Table Columns Specification (E.2.1)
  const columns = [
    {
      key: "stt",
      title: "STT",
      render: (_, i) => (page - 1) * pageSize + i + 1,
    },
    {
      key: "form",
      title: "Biểu mẫu",
      render: (r) => (
        <div>
          <span className="font-semibold text-slate-800">{r.formCode}</span>
        </div>
      ),
    },
    {
      key: "versionNo",
      title: "Mã phiên bản",
      render: (r) => (
        <span className="font-mono text-sm font-semibold text-brand">
          {r.versionNo || "v1.0"}
        </span>
      ),
    },
    {
      key: "formName",
      title: "Tên phiên bản",
      render: (r) => (
        <span className="font-medium text-slate-900">{r.formName}</span>
      ),
    },
    {
      key: "semesterName",
      title: "Học kỳ áp dụng",
      render: (r) => (
        <span className="text-slate-700">{r.semesterName || "Chưa gán"}</span>
      ),
    },
    {
      key: "scope",
      title: "Phạm vi áp dụng",
      render: (r) => (
        <span className="text-slate-600">{r.scope || "Toàn hệ thống"}</span>
      ),
    },
    {
      key: "effectivePeriod",
      title: "Có hiệu lực từ / Ngày hết hiệu lực",
      render: (r) => {
        const from = formatDate(r.effectiveFrom);
        const to = r.effectiveTo ? formatDate(r.effectiveTo) : "Vô thời hạn";
        return (
          <span className="text-sm text-slate-600">
            {from ? `${from} - ${to}` : to}
          </span>
        );
      },
    },
    {
      key: "status",
      title: "Trạng thái",
      render: (r) => <div className="whitespace-nowrap">{renderStatusTag(r.status)}</div>,
    },
    {
      key: "actions",
      title: "Thao tác",
      render: (r) => {
        const isDeactivated = r.status === "INACTIVE";
        const isActive = r.status === "ACTIVE";

        return (
          <div className="flex items-center gap-1 whitespace-nowrap">
            {/* 1. Xem chi tiết */}
            <IconButton
              label="Xem chi tiết"
              onClick={() => handleOpenVersions(r)}
            >
              <Eye className="size-4 text-slate-600 hover:text-brand" />
            </IconButton>

            {/* 2. Yêu cầu sửa: Ẩn nếu trạng thái là Vô hiệu hóa */}
            {!isDeactivated && (
              <IconButton
                label="Yêu cầu sửa"
                onClick={() => navigate(`/admin/form-versions/${r.id}/edit`)}
              >
                <Pencil className="size-4 text-slate-600 hover:text-brand" />
              </IconButton>
            )}

            {/* 3. Yêu cầu vô hiệu hóa: Chỉ hiển thị với phiên bản đang Hiệu lực */}
            {isActive && (
              <IconButton
                label="Yêu cầu vô hiệu hóa"
                onClick={() => handleOpenDeactivate(r)}
                className="text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                <CircleOff className="size-4" />
              </IconButton>
            )}

            {/* 4. Yêu cầu kích hoạt: Chỉ hiển thị với bản ghi đang bị Vô hiệu hóa */}
            {isDeactivated && (
              <IconButton
                label="Yêu cầu kích hoạt"
                onClick={() => handleOpenActivate(r)}
                className="text-green-600 hover:bg-green-50 hover:text-green-700"
              >
                <CheckCircle className="size-4" />
              </IconButton>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <>
      <PageTitle
        title="Danh sách phiên bản biểu mẫu"
        description="Quản lý cấu hình, phạm vi và trạng thái hiệu lực của các phiên bản biểu mẫu đánh giá điểm rèn luyện."
        action={
          <Button
            variant="primary"
            onClick={() => {
              sessionStorage.removeItem("drl_designer_layout_new");
              navigate("/admin/form-versions/new");
            }}
          >
            <Plus className="size-4" />
            Thêm mới
          </Button>
        }
      />

      {/* Filter Bar (Tìm kiếm theo các tiêu chí chuẩn E.2.1) */}
      <Card className="mb-4">
        <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-5">
          <Input
            label="Biểu mẫu"
            placeholder="Mã hoặc tên biểu mẫu"
            value={filters.formQuery}
            onChange={(e) => setFilters({ ...filters, formQuery: e.target.value })}
          />

          <Input
            label="Tên phiên bản"
            placeholder="Nhập tên phiên bản"
            value={filters.nameQuery}
            onChange={(e) => setFilters({ ...filters, nameQuery: e.target.value })}
          />

          <Select
            label="Trạng thái"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="ACTIVE">Hiệu lực</option>
            <option value="EXPIRED">Hết hiệu lực</option>
            <option value="INACTIVE">Vô hiệu hóa</option>
          </Select>

          <Select
            label="Đơn vị quản lý"
            value={filters.scope}
            onChange={(e) => setFilters({ ...filters, scope: e.target.value })}
          >
            <option value="">Tất cả đơn vị</option>
            <option value="Toàn hệ thống">Toàn hệ thống</option>
            {departments.map((d) => (
              <option key={d.id} value={d.deptName}>
                {d.deptName}
              </option>
            ))}
          </Select>

          <Select
            label="Học kỳ áp dụng"
            value={filters.semesterId}
            onChange={(e) => setFilters({ ...filters, semesterId: e.target.value })}
          >
            <option value="">Tất cả học kỳ</option>
            {semesters.map((s) => (
              <option key={s.id} value={s.id}>
                {s.semesterName}
              </option>
            ))}
          </Select>
        </div>

        <div className="mt-4 flex items-center justify-end gap-2 border-t border-line pt-3">
          <Button
            variant="ghost"
            onClick={() =>
              setFilters({
                formQuery: "",
                nameQuery: "",
                status: "",
                scope: "",
                semesterId: "",
              })
            }
          >
            <RotateCcw className="size-4" />
            Xóa bộ lọc
          </Button>
          <Button variant="primary" onClick={() => setPage(1)}>
            <Search className="size-4" />
            Tìm kiếm
          </Button>
        </div>
      </Card>

      {/* Data Table */}
      <div className="mt-4">
        <Table
          columns={columns}
          rows={paginatedData}
          loading={loading}
        />

        {/* Phân trang */}
        <div className="mt-4 flex items-center justify-between rounded-lg border border-line bg-white px-4 py-3 shadow-sm">
          <span className="text-sm text-muted">
            Tổng số {filteredData.length} phiên bản
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <span className="text-sm font-medium px-2">Trang {page} / {totalPages}</span>
            <Button
              variant="ghost"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Modal: Xem chi tiết danh sách các version của biểu mẫu */}
      <Modal
        open={versionModalOpen}
        wide
        title={`Danh sách các phiên bản: ${selectedForm?.formCode || ""}`}
        onClose={() => setVersionModalOpen(false)}
        footer={
          <Button onClick={() => setVersionModalOpen(false)}>
            Đóng
          </Button>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Dưới đây là danh sách tất cả các phiên bản (version) đã được tạo cho biểu mẫu{" "}
            <strong>{selectedForm?.formName}</strong>. Bấm nút <strong>Xem</strong> để hiển thị chi tiết cấu hình và bản xem trước biểu mẫu.
          </p>

          <div className="overflow-x-auto rounded-lg border border-line">
            <table className="w-full text-left text-sm">
              <thead className="bg-canvas font-semibold text-slate-700">
                <tr>
                  <th className="px-4 py-3">STT</th>
                  <th className="px-4 py-3">Mã version</th>
                  <th className="px-4 py-3">Tên phiên bản</th>
                  <th className="px-4 py-3">Học kỳ</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3">Ngày tạo</th>
                  <th className="px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loadingVersions ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-slate-500">
                      Đang tải danh sách version...
                    </td>
                  </tr>
                ) : (
                  versionList.map((ver, idx) => (
                    <tr key={ver.id || idx} className="border-t border-line hover:bg-canvas">
                      <td className="px-4 py-3">{idx + 1}</td>
                      <td className="px-4 py-3 font-mono font-semibold text-brand">
                        {ver.versionNo || "v1.0"}
                      </td>
                      <td className="px-4 py-3">{ver.formName}</td>
                      <td className="px-4 py-3">{ver.semesterName || selectedForm?.semesterName}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{renderStatusTag(ver.status)}</td>
                      <td className="px-4 py-3 text-slate-500">{formatDate(ver.createdAt)}</td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="secondary"
                          className="h-8 px-3 text-xs"
                          onClick={() => {
                            setVersionModalOpen(false);
                            navigate(`/admin/form-versions/${ver.id}`);
                          }}
                        >
                          <Eye className="size-3.5 mr-1" />
                          Xem
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>

      {/* Modal: Xác nhận Yêu cầu vô hiệu hóa */}
      <Modal
        open={deactivateModalOpen}
        title="Yêu cầu vô hiệu hóa phiên bản biểu mẫu"
        onClose={() => !deactivating && setDeactivateModalOpen(false)}
        footer={
          <>
            <Button
              disabled={deactivating}
              onClick={() => setDeactivateModalOpen(false)}
            >
              Hủy
            </Button>
            <Button
              variant="danger"
              loading={deactivating}
              onClick={handleConfirmDeactivate}
            >
              Xác nhận
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-lg bg-red-50 p-3 text-red-800 border border-red-200">
            <AlertTriangle className="size-5 shrink-0 text-red-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold">Cảnh báo vô hiệu hóa phiên bản</p>
              <p className="mt-1">
                Bạn đang yêu cầu tạm thời ngưng sử dụng phiên bản{" "}
                <strong>{targetDeactivateItem?.formName} ({targetDeactivateItem?.versionNo})</strong>.
                Sau khi xác nhận, phiên bản sẽ không còn hiệu lực sử dụng trên toàn hệ thống.
              </p>
            </div>
          </div>

          {deactivateError && (
            <div className="rounded-lg border border-red-300 bg-red-100 p-3 text-sm font-medium text-red-800">
              {deactivateError}
            </div>
          )}

          <div>
            <Textarea
              label="Lý do vô hiệu hóa"
              placeholder="Nhập lý do tạm thời ngưng sử dụng phiên bản biểu mẫu..."
              value={deactivateReason}
              onChange={(e) => setDeactivateReason(e.target.value)}
              maxLength={500}
            />
          </div>
        </div>
      </Modal>

      {/* Modal: Xác nhận Yêu cầu kích hoạt */}
      <Modal
        open={activateModalOpen}
        title="Yêu cầu kích hoạt phiên bản biểu mẫu"
        onClose={() => !activating && setActivateModalOpen(false)}
        footer={
          <>
            <Button
              disabled={activating}
              onClick={() => setActivateModalOpen(false)}
            >
              Hủy
            </Button>
            <Button
              variant="primary"
              loading={activating}
              onClick={handleConfirmActivate}
            >
              Xác nhận
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-lg bg-blue-50 p-3 text-blue-800 border border-blue-200">
            <CheckCircle className="size-5 shrink-0 text-blue-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold">Kích hoạt phiên bản biểu mẫu</p>
              <p className="mt-1">
                Xác nhận kích hoạt phiên bản{" "}
                <strong>{targetActivateItem?.formName} ({targetActivateItem?.versionNo})</strong>.
                Phiên bản này sẽ trở thành phiên bản có hiệu lực chính thức để áp dụng cho học kỳ{" "}
                <strong>{targetActivateItem?.semesterName}</strong>.
              </p>
            </div>
          </div>

          <div>
            <Textarea
              label="Lý do kích hoạt"
              placeholder="Nhập lý do kích hoạt lại phiên bản biểu mẫu..."
              value={activateReason}
              onChange={(e) => setActivateReason(e.target.value)}
              maxLength={500}
            />
          </div>
        </div>
      </Modal>
    </>
  )
}

