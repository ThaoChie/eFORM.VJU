import { ArrowLeft, Pencil, History, CheckCircle2, Clock, Eye, AlertCircle, CircleOff, CheckCircle } from "lucide-react"
import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { toast } from "react-hot-toast"
import {
  Button,
  Card,
  PageTitle,
  Select,
  Table,
} from "../../../components/ui/Primitives"
import { client } from "../../../lib/axios/client"

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "—";
  const pad = (n) => n.toString().padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

export default function FieldCodeDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [field, setField] = useState(null);
  const [versions, setVersions] = useState([]);
  const [selectedVersion, setSelectedVersion] = useState("");
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  const handleToggleStatus = async () => {
    if (toggling || !field) return;
    setToggling(true);
    try {
      const res = await client.patch(`/fields/${id}/toggle-status`);
      const newStatus = res?.isActive ?? res?.data?.isActive ?? !field.isActive;
      toast.success(newStatus ? "Đã kích hoạt trường thông tin" : "Đã vô hiệu hóa trường thông tin");
      setField(prev => ({ ...prev, isActive: newStatus }));
      try {
        const vRes = await client.get(`/fields/${id}/versions`);
        if (Array.isArray(vRes)) setVersions(vRes);
      } catch (err) {}
    } catch(e) {
      toast.error(e?.response?.data?.message || "Lỗi thay đổi trạng thái");
    } finally {
      setToggling(false);
    }
  };

  useEffect(() => {
    const loadField = async () => {
      setLoading(true);
      try {
        let fieldData = null;
        let versionList = [];

        try {
          fieldData = await client.get(`/fields/${id}`);
          if (fieldData && fieldData.versions && fieldData.versions.length > 0) {
            versionList = fieldData.versions;
          }
        } catch (err) {
          // Fallback to list search if direct endpoint fails
          const res = await client.get("/fields", { params: { page: 0, size: 100 } });
          fieldData = res.content?.find(x => x.id === Number(id));
        }

        if (fieldData) {
          // If versions wasn't included in fieldData, try fetching /versions
          if (versionList.length === 0) {
            try {
              const vRes = await client.get(`/fields/${id}/versions`);
              if (Array.isArray(vRes)) {
                versionList = vRes;
              }
            } catch (err) {
              // Ignore version load error
            }
          }

          // If still no versions, create mock/single version entry from current
          if (versionList.length === 0) {
            versionList = [{
              ...fieldData,
              version: fieldData.version || "1.0",
              createdAt: fieldData.updatedAt || fieldData.createdAt || new Date().toISOString()
            }];
          }

          setField(fieldData);
          setVersions(versionList);
          setSelectedVersion(fieldData.version || versionList[0]?.version || "1.0");
        } else {
          toast.error("Không tìm thấy trường thông tin");
        }
      } catch (e) {
        toast.error("Lỗi tải chi tiết trường thông tin");
      } finally {
        setLoading(false);
      }
    };
    loadField();
  }, [id]);

  if (loading) return <div className="p-8 text-center text-muted">Đang tải...</div>;
  if (!field) return <div className="p-8 text-center text-red-500">Dữ liệu không tồn tại.</div>;

  // Selected snapshot to display
  const isViewingLatest = !selectedVersion || selectedVersion === field.version;
  const currentSnapshot = versions.find(v => v.version === selectedVersion) || field;

  const versionHistoryColumns = [
    {
      key: "stt",
      title: "STT",
      render: (_, i) => i + 1
    },
    {
      key: "version",
      title: "Phiên bản",
      render: (v) => (
        <span className="inline-flex items-center gap-1.5 font-mono font-semibold text-brand">
          v{v.version}
          {v.version === field.version && (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800">
              Hiện tại
            </span>
          )}
        </span>
      )
    },
    {
      key: "fieldName",
      title: "Tên trường",
      render: (v) => v.fieldName
    },
    {
      key: "dataType",
      title: "Kiểu dữ liệu",
      render: (v) => <span className="font-mono text-xs">{v.dataType}</span>
    },
    {
      key: "isRequired",
      title: "Bắt buộc",
      render: (v) => v.isRequired ? "Có" : "Không"
    },
    {
      key: "status",
      title: "Trạng thái",
      render: (v) => (
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${v.isActive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {v.isActive ? "Đang hiệu lực" : "Vô hiệu hóa"}
        </span>
      )
    },
    {
      key: "createdAt",
      title: "Thời điểm ghi nhận",
      render: (v) => formatDate(v.createdAt)
    },
    {
      key: "action",
      title: "Thao tác",
      render: (v) => (
        <Button
          size="sm"
          variant={v.version === selectedVersion ? "primary" : "ghost"}
          onClick={() => setSelectedVersion(v.version)}
        >
          <Eye className="size-3.5 mr-1" />
          {v.version === selectedVersion ? "Đang xem" : "Xem bản này"}
        </Button>
      )
    }
  ];

  return (
    <>
      <PageTitle
        title="Chi tiết Trường thông tin"
        description={`Xem chi tiết cấu hình và lịch sử phiên bản của trường ${field.fieldCode}`}
        action={
          <div className="flex items-center gap-2">
            <Button onClick={() => navigate(-1)}>
              <ArrowLeft className="size-4" />
              Quay lại
            </Button>
            <Button
              variant={field.isActive ? "danger" : "secondary"}
              onClick={handleToggleStatus}
              disabled={toggling}
            >
              {field.isActive ? <CircleOff className="size-4" /> : <CheckCircle className="size-4" />}
              {field.isActive ? "Vô hiệu hóa" : "Kích hoạt"}
            </Button>
            <Button variant="primary" onClick={() => navigate(`/admin/field-codes/${id}/edit`)}>
              <Pencil className="size-4" />
              Chỉnh sửa
            </Button>
          </div>
        }
      />

      <div className="space-y-4 w-full">
        {/* Version Switcher Bar */}
        <Card className="bg-gradient-to-r from-slate-50 to-white border-line">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-blue-50 text-brand">
                <History className="size-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-muted font-medium">Phiên bản đang xem</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-lg font-bold font-mono text-slate-800">v{currentSnapshot.version || field.version}</span>
                  {isViewingLatest ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 border border-emerald-200">
                      <CheckCircle2 className="size-3" /> Phiên bản hiện tại
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800 border border-amber-200">
                      <Clock className="size-3" /> Bản lịch sử lưu trữ
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-muted whitespace-nowrap">Chọn phiên bản:</label>
              <select
                value={selectedVersion}
                onChange={(e) => setSelectedVersion(e.target.value)}
                className="rounded-md border border-line bg-white px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand shadow-sm"
              >
                {versions.map((v) => (
                  <option key={v.version} value={v.version}>
                    v{v.version} {v.version === field.version ? "(Hiện tại)" : ""} — {formatDate(v.createdAt)}
                  </option>
                ))}
              </select>
              {!isViewingLatest && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedVersion(field.version)}
                  className="text-xs text-brand"
                >
                  Về bản hiện tại
                </Button>
              )}
            </div>
          </div>

          {!isViewingLatest && (
            <div className="mt-3 flex items-start gap-2 rounded-md bg-amber-50 p-2.5 text-xs text-amber-800 border border-amber-200">
              <AlertCircle className="size-4 shrink-0 text-amber-600 mt-0.5" />
              <span>
                Bạn đang xem dữ liệu snapshot lưu trữ của <strong>phiên bản {currentSnapshot.version}</strong> (ghi nhận lúc {formatDate(currentSnapshot.createdAt)}). Thông tin này phản ánh cấu hình tại thời điểm đó và không thể chỉnh sửa trực tiếp.
              </span>
            </div>
          )}
        </Card>

        {/* Thông tin chung */}
        <Card>
          <div className="flex items-center justify-between border-b border-line pb-3 mb-4">
            <h2 className="font-semibold text-slate-800">Thông tin chung</h2>
            <span className="text-xs text-muted">
              Cập nhật lần cuối: <strong className="text-slate-700">{formatDate(currentSnapshot.createdAt || field.updatedAt || field.createdAt)}</strong>
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-y-4 gap-x-6 text-sm">
            <div>
              <p className="text-muted mb-1 text-xs">Mã trường</p>
              <p className="font-semibold font-mono text-brand text-base">{currentSnapshot.fieldCode}</p>
            </div>
            <div>
              <p className="text-muted mb-1 text-xs">Tên trường</p>
              <p className="font-medium text-slate-800 text-base">{currentSnapshot.fieldName}</p>
            </div>
            <div>
              <p className="text-muted mb-1 text-xs">Nhóm trường</p>
              <p className="font-medium text-slate-700">{currentSnapshot.category || "COMMON"}</p>
            </div>
            <div>
              <p className="text-muted mb-1 text-xs">Kiểu dữ liệu</p>
              <span className="font-mono px-2 py-0.5 bg-slate-100 rounded text-slate-800 font-medium text-xs">
                {currentSnapshot.dataType}
              </span>
            </div>
            <div>
              <p className="text-muted mb-1 text-xs">Phiên bản</p>
              <p className="font-mono font-semibold text-slate-700">v{currentSnapshot.version || field.version}</p>
            </div>
            <div>
              <p className="text-muted mb-1 text-xs">Trạng thái hiệu lực</p>
              <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${currentSnapshot.isActive ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                {currentSnapshot.isActive ? "Đang hiệu lực" : "Vô hiệu hóa"}
              </span>
            </div>
          </div>
        </Card>
        
        {/* Quy tắc xác thực */}
        <Card>
          <h2 className="mb-4 font-semibold border-b border-line pb-3 text-slate-800">Quy tắc xác thực</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-6 text-sm">
            <div>
              <p className="text-muted mb-1 text-xs">Bắt buộc nhập</p>
              <p className="font-medium text-slate-800">{currentSnapshot.isRequired ? "Có" : "Không"}</p>
            </div>
            {currentSnapshot.dataType === "NUMBER" && (
              <>
                <div>
                  <p className="text-muted mb-1 text-xs">Giá trị nhỏ nhất</p>
                  <p className="font-medium text-slate-800">{currentSnapshot.minValue !== null && currentSnapshot.minValue !== undefined ? currentSnapshot.minValue : "Không giới hạn"}</p>
                </div>
                <div>
                  <p className="text-muted mb-1 text-xs">Giá trị lớn nhất</p>
                  <p className="font-medium text-slate-800">{currentSnapshot.maxValue !== null && currentSnapshot.maxValue !== undefined ? currentSnapshot.maxValue : "Không giới hạn"}</p>
                </div>
              </>
            )}
            <div className="col-span-full">
              <p className="text-muted mb-1 text-xs">Biểu thức chính quy (Regex)</p>
              <p className="font-mono bg-slate-50 p-2.5 rounded-lg border border-line text-xs text-slate-800">{currentSnapshot.regexPattern || "Không có"}</p>
            </div>
            <div className="col-span-full">
              <p className="text-muted mb-1 text-xs">Ghi chú / Mô tả</p>
              <p className="font-medium whitespace-pre-wrap bg-slate-50 p-3 rounded-lg border border-line text-xs text-slate-700">{currentSnapshot.description || "Không có"}</p>
            </div>
          </div>
        </Card>

        {/* Lịch sử các phiên bản */}
        <Card>
          <div className="flex items-center justify-between border-b border-line pb-3 mb-4">
            <div className="flex items-center gap-2">
              <History className="size-4 text-brand" />
              <h2 className="font-semibold text-slate-800">Lịch sử thay đổi qua các phiên bản</h2>
            </div>
            <span className="text-xs text-muted">Tổng số: <strong>{versions.length}</strong> phiên bản</span>
          </div>

          <Table
            rows={versions}
            columns={versionHistoryColumns}
          />
        </Card>

        {/* Sticky footer actions */}
        <div className="sticky bottom-0 flex justify-end gap-2 rounded-lg border border-line bg-white/95 backdrop-blur p-4 shadow-sm">
          <Button onClick={() => navigate(-1)}>
            <ArrowLeft className="size-4" />
            Quay lại danh sách
          </Button>
          <Button
            variant={field.isActive ? "danger" : "secondary"}
            onClick={handleToggleStatus}
            disabled={toggling}
          >
            {field.isActive ? <CircleOff className="size-4" /> : <CheckCircle className="size-4" />}
            {field.isActive ? "Vô hiệu hóa" : "Kích hoạt"}
          </Button>
          <Button variant="primary" onClick={() => navigate(`/admin/field-codes/${id}/edit`)}>
            <Pencil className="size-4" />
            Chỉnh sửa trường này
          </Button>
        </div>
      </div>
    </>
  )
}
