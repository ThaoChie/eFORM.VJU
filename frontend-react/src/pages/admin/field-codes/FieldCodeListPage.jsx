import { Eye, Pencil, Plus, Search, Upload, Settings, Download, CircleOff, CheckCircle, ChevronLeft, ChevronRight } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"
import { toast } from "react-hot-toast"
import {
  Button,
  FilterBar,
  Card,
  IconButton,
  Input,
  PageTitle,
  Select,
  Table,
  Modal
} from "../../../components/ui/Primitives"
import { client } from "../../../lib/axios/client"
import { downloadExcelTemplate } from "../../../lib/downloadHelper"

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const pad = (n) => n.toString().padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export default function FieldCodeListPage() {
  const handleDownloadTemplate = async () => {
    try {
      await downloadExcelTemplate("field-codes", client);
      toast.success("Tải file mẫu thành công!");
    } catch (e) {
      console.error("Lỗi tải file mẫu:", e);
      toast.error("Không thể tải file mẫu");
    }
  };
  const navigate = useNavigate()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [colConfig, setColConfig] = useState(false)
  const [hiddenCols, setHiddenCols] = useState({})
  const [importExcel, setImportExcel] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [importData, setImportData] = useState(null)
  const [importing, setImporting] = useState(false)
  const [togglingId, setTogglingId] = useState(null)

  // Filters
  const [filters, setFilters] = useState({
    keyword: "",
    category: "",
    dataType: "",
    status: ""
  });

  const fetchFields = async () => {
    setLoading(true);
    try {
      const res = await client.get("/fields", { params: { page: page - 1, size: 10 } });
      setData(res.content || []);
      setTotalPages(res.totalPages || 1);
    } catch (e) {
      toast.error("Lỗi tải danh sách trường thông tin");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFields();
  }, [page]);

  const toggleStatus = async (id) => {
    if (togglingId) return;
    setTogglingId(id);
    try {
      const res = await client.patch(`/fields/${id}/toggle-status`);
      const newStatus = res?.isActive ?? res?.data?.isActive;
      toast.success(newStatus ? "Đã kích hoạt trường thông tin" : "Đã vô hiệu hóa trường thông tin");
      // Cập nhật trạng thái chính xác cho riêng trường thông tin này
      setData(prev => prev.map(item => {
        if (item.id === id) {
          return { ...item, isActive: newStatus !== undefined ? newStatus : !item.isActive };
        }
        return item;
      }));
      await fetchFields();
    } catch(e) {
      toast.error(e?.response?.data?.message || "Lỗi thay đổi trạng thái");
    } finally {
      setTogglingId(null);
    }
  };

  // Filter local processing since backend API doesn't have filter params yet
  const filteredData = data.filter(item => {
    if (filters.keyword) {
      const q = filters.keyword.trim().toLowerCase();
      const matchCode = item.fieldCode?.toLowerCase().includes(q);
      const matchName = item.fieldName?.toLowerCase().includes(q);
      if (!matchCode && !matchName) return false;
    }
    if (filters.category && item.category !== filters.category) return false;
    if (filters.dataType && item.dataType !== filters.dataType) return false;
    if (filters.status) {
      if (filters.status === "ACTIVE" && !item.isActive) return false;
      if (filters.status === "INACTIVE" && item.isActive) return false;
    }
    return true;
  });

  const columns = [
    { key: "stt", title: "STT", render: (_, i) => (page - 1) * 10 + i + 1 },
    {
      key: "code",
      title: "Mã trường",
      render: (r) => (
        <button 
          onClick={() => navigate(`/admin/field-codes/${r.id}`)}
          className="font-mono text-brand hover:underline text-left"
        >
          {r.fieldCode}
        </button>
      ),
    },
    { key: "name", title: "Tên trường", render: (r) => r.fieldName },
    { key: "category", title: "Nhóm trường", render: (r) => r.category || "COMMON" },
    { key: "type", title: "Kiểu dữ liệu", render: (r) => r.dataType },
    { key: "version", title: "Phiên bản", render: (r) => <span className="font-mono font-medium text-slate-700">v{r.version || "1.0"}</span> },
    {
      key: "status",
      title: "Trạng thái hiệu lực",
      render: (r) => (
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
            r.isActive
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {r.isActive ? "Đang hiệu lực" : "Vô hiệu hóa"}
        </span>
      ),
    },
    { key: "updatedAt", title: "Cập nhật lần cuối", render: (r) => r.updatedAt ? formatDate(r.updatedAt) : formatDate(r.createdAt || Date.now()) },
    {
      key: "action",
      title: "Thao tác",
      render: (r) => (
        <div className="flex gap-1">
          <IconButton
            label="Xem chi tiết"
            onClick={() => navigate(`/admin/field-codes/${r.id}`)}
          >
            <Eye className="size-4" />
          </IconButton>
          <IconButton
            label="Yêu cầu sửa"
            onClick={() => navigate(`/admin/field-codes/${r.id}/edit`)}
          >
            <Pencil className="size-4" />
          </IconButton>
          <IconButton
            label={r.isActive ? "Vô hiệu hóa" : "Kích hoạt"}
            disabled={togglingId === r.id}
            onClick={() => toggleStatus(r.id)}
            className={r.isActive ? "text-red-600 hover:text-red-700" : "text-green-600 hover:text-green-700"}
          >
            {r.isActive ? <CircleOff className="size-4" /> : <CheckCircle className="size-4" />}
          </IconButton>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageTitle
        title="Trường thông tin"
        description="Quản lý cấu hình các trường dữ liệu dùng để thiết kế biểu mẫu E-Form."
        action={
          <div className="flex gap-2">
            <Button onClick={() => setColConfig(true)}>
              <Settings className="size-4" /> Cấu hình cột
            </Button>
            <Button onClick={handleDownloadTemplate}>
              <Download className="size-4" />
              Tải file mẫu
            </Button>
            <Button onClick={() => {
              setSelectedFile(null);
              setImportData(null);
              setImportExcel(true);
            }}>
              <Upload className="size-4" />
              Thêm mới theo lô
            </Button>
            <Button variant="primary" onClick={() => navigate(`/admin/field-codes/new`)}>
              <Plus className="size-4" />
              Thêm mới
            </Button>
          </div>
        }
      />
      <Card className="mb-4">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="md:col-span-2">
            <Input
              label="Mã - Tên trường"
              placeholder="Nhập mã hoặc tên trường"
              value={filters.keyword}
              onChange={e => setFilters({...filters, keyword: e.target.value})}
            />
          </div>
          <Select label="Nhóm trường" value={filters.category} onChange={e => setFilters({...filters, category: e.target.value})}>
            <option value="">Tất cả nhóm</option>
            <option value="COMMON">COMMON</option>
            <option value="HEADER">HEADER</option>
            <option value="FOOTER">FOOTER</option>
          </Select>
          <Select label="Kiểu dữ liệu" value={filters.dataType} onChange={e => setFilters({...filters, dataType: e.target.value})}>
            <option value="">Tất cả kiểu</option>
            <option value="STRING">STRING</option>
            <option value="NUMBER">NUMBER</option>
            <option value="DATE">DATE</option>
            <option value="BOOLEAN">BOOLEAN</option>
            <option value="FILE">FILE</option>
            <option value="SIGNATURE">SIGNATURE</option>
          </Select>
          <Select label="Trạng thái hiệu lực" value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})}>
            <option value="">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang hiệu lực</option>
            <option value="INACTIVE">Vô hiệu hóa</option>
          </Select>
          
          <div className="flex items-end gap-3 md:justify-end">
            <Button variant="ghost" onClick={() => setFilters({ keyword: "", category: "", dataType: "", status: "" })}>
              Xóa bộ lọc
            </Button>
            <Button variant="primary" onClick={() => { /* Filters are processed locally already */ }}>
              <Search className="size-4" /> Tìm kiếm
            </Button>
          </div>
        </div>
      </Card>
      <div className="mt-4">
        <Table
          rows={filteredData}
          columns={columns.filter(c => !hiddenCols[c.key])}
          loading={loading}
        />
        
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-line px-4 py-3 bg-white mt-4 rounded-lg border shadow-sm">
            <span className="text-sm text-muted">Tổng số {filteredData.length} trường dữ liệu</span>
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
        )}
      </div>
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
        title="Thêm mới theo lô (Nhập từ Excel)"
        onClose={() => {
          setImportExcel(false);
          setImportData(null);
          setSelectedFile(null);
        }}
        footer={
          <>
            <Button
              onClick={() => {
                setImportExcel(false);
                setImportData(null);
                setSelectedFile(null);
              }}
            >
              Hủy
            </Button>
            {importData ? (
              <Button
                variant="primary"
                loading={importing}
                disabled={!importData || importData.validRows === 0}
                onClick={async () => {
                  setImporting(true);
                  try {
                    const formData = new FormData();
                    formData.append("file", selectedFile);
                    const res = await client.post("/fields/import?preview=false", formData, {
                      headers: { "Content-Type": "multipart/form-data" }
                    });
                    const count = res?.validRows ?? res?.data?.validRows ?? importData.validRows;
                    toast.success(`Thêm mới theo lô thành công (${count} trường thông tin)!`);
                    setImportExcel(false);
                    setImportData(null);
                    setSelectedFile(null);
                    fetchFields();
                  } catch (err) {
                    toast.error(err.response?.data?.message || err.message || "Có lỗi xảy ra khi nhập dữ liệu!");
                  } finally {
                    setImporting(false);
                  }
                }}
              >
                Xác nhận Nhập ({importData.validRows} trường)
              </Button>
            ) : (
              <Button
                variant="primary"
                disabled={!selectedFile}
                loading={importing}
                onClick={async () => {
                  setImporting(true);
                  try {
                    const formData = new FormData();
                    formData.append("file", selectedFile);
                    const res = await client.post("/fields/import?preview=true", formData, {
                      headers: { "Content-Type": "multipart/form-data" }
                    });
                    setImportData(res?.data || res);
                  } catch (err) {
                    toast.error(err.response?.data?.message || err.message || "Lỗi đọc file Excel!");
                  } finally {
                    setImporting(false);
                  }
                }}
              >
                Xem trước dữ liệu
              </Button>
            )}
          </>
        }
      >
        <div className="space-y-4">
          {!importData ? (
            <>
              <div
                onClick={() => {
                  const input = document.createElement("input");
                  input.type = "file";
                  input.accept = ".xlsx, .xls";
                  input.onchange = (e) => {
                    if (e.target.files.length > 0) setSelectedFile(e.target.files[0]);
                  };
                  input.click();
                }}
                className={`rounded-lg border-2 border-dashed p-8 text-center cursor-pointer transition ${
                  selectedFile ? "border-brand bg-brand-soft" : "border-line hover:bg-canvas"
                }`}
              >
                <Upload className={`size-8 mx-auto mb-3 ${selectedFile ? "text-brand" : "text-muted"}`} />
                <p className={`font-medium ${selectedFile ? "text-brand" : ""}`}>
                  {selectedFile ? selectedFile.name : "Click để chọn file từ máy tính"}
                </p>
                {!selectedFile && <p className="text-sm text-muted mt-1">hoặc kéo thả file Excel vào đây</p>}
              </div>
              <div className="flex justify-between items-center text-sm px-1">
                <span className="text-muted">Chưa có file mẫu dữ liệu?</span>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="text-brand hover:underline font-medium inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="size-4" /> Tải file mẫu trường thông tin
                </button>
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
                  <ul className="list-disc pl-5 space-y-1 max-h-48 overflow-y-auto">
                    {importData.errors.map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-sm text-green-600 font-medium">
                  Tất cả dữ liệu đều hợp lệ. Bạn có thể tiến hành nhập!
                </p>
              )}
            </div>
          )}
        </div>
      </Modal>
    </>
  )
}
