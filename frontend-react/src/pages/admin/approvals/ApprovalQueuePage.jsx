import { useState, useEffect } from "react"
import { toast } from "react-hot-toast"
import { CheckCircle2, XCircle, AlertCircle, RefreshCw } from "lucide-react"
import {
  ActionViewButton,
  Button,
  CancelButton,
  ConfirmButton,
  Modal,
  PageTitle,
  Table,
  Textarea,
} from "../../../components/ui/Primitives"
import { client } from "../../../lib/axios/client"

const formatDate = (dateStr) => {
  if (!dateStr) return "—"
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    const pad = (n) => n.toString().padStart(2, "0")
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
  } catch (e) {
    return dateStr
  }
}

export default function ApprovalQueuePage() {
  const [activeTab, setActiveTab] = useState("PENDING") // PENDING | ALL
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState(null)
  const [reason, setReason] = useState("")
  const [processing, setProcessing] = useState(false)

  const fetchQueue = async () => {
    setLoading(true)
    try {
      const res = await client.get("/admin/pending-queue", {
        params: { tab: activeTab },
      })
      setData(Array.isArray(res) ? res : res?.data || [])
    } catch (err) {
      console.error("Lỗi nạp danh sách chờ xử lý:", err)
      toast.error("Không thể tải danh sách chờ xử lý")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchQueue()
  }, [activeTab])

  const handleApprove = async () => {
    if (!detail) return
    setProcessing(true)
    try {
      await client.post(`/admin/pending-queue/${detail.type}/${detail.id}/approve`, {
        reason: reason.trim() || undefined,
      })
      toast.success(`Đã phê duyệt "${detail.name}" thành công!`)
      setDetail(null)
      setReason("")
      fetchQueue()
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Lỗi khi phê duyệt"
      toast.error(msg)
    } finally {
      setProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!detail) return
    if (!reason.trim()) {
      return toast.error("Vui lòng nhập ghi chú / lý do từ chối")
    }
    setProcessing(true)
    try {
      await client.post(`/admin/pending-queue/${detail.type}/${detail.id}/reject`, {
        reason: reason.trim(),
      })
      toast.success(`Đã từ chối yêu cầu "${detail.name}"`)
      setDetail(null)
      setReason("")
      fetchQueue()
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Lỗi khi từ chối yêu cầu"
      toast.error(msg)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <>
      <PageTitle
        title="Danh sách chờ xử lý"
        description="Quản lý và phê duyệt các yêu cầu cấu hình và phiếu điểm rèn luyện trong hệ thống."
        action={
          <Button
            variant="secondary"
            className="text-xs"
            onClick={fetchQueue}
            loading={loading}
          >
            <RefreshCw className="size-3.5 mr-1" />
            Làm mới
          </Button>
        }
      />

      <div className="mb-4 flex gap-4 border-b border-slate-200 text-sm">
        <button
          type="button"
          onClick={() => setActiveTab("PENDING")}
          className={`pb-3 font-medium transition-colors ${
            activeTab === "PENDING"
              ? "border-b-2 border-slate-900 text-slate-900"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Chờ xử lý ({data.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("ALL")}
          className={`pb-3 font-medium transition-colors ${
            activeTab === "ALL"
              ? "border-b-2 border-slate-900 text-slate-900"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Tất cả yêu cầu
        </button>
      </div>

      <Table
        loading={loading}
        rows={data}
        onRow={(r) => {
          setDetail(r)
          setReason("")
        }}
        columns={[
          { key: "stt", title: "STT", render: (_, i) => i + 1 },
          {
            key: "type",
            title: "Loại đối tượng",
            render: (r) => (
              <span className="text-xs text-slate-600">
                {r.typeName}
              </span>
            ),
          },
          {
            key: "code",
            title: "Mã",
            render: (r) => (
              <code className="text-xs bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                {r.code}
              </code>
            ),
          },
          {
            key: "name",
            title: "Tên / Nội dung",
            render: (r) => (
              <span className="font-medium text-slate-800">
                {r.name}
              </span>
            ),
          },
          {
            key: "request",
            title: "Loại yêu cầu",
            render: (r) => (
              <span className="text-xs text-slate-600 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
                {r.requestType}
              </span>
            ),
          },
          {
            key: "owner",
            title: "Người gửi yêu cầu",
            render: (r) => (
              <span className="text-xs text-slate-700">
                {r.owner}
              </span>
            ),
          },
          {
            key: "date",
            title: "Ngày gửi",
            render: (r) => (
              <span className="text-xs text-slate-500">
                {formatDate(r.date)}
              </span>
            ),
          },
          {
            key: "action",
            title: "Thao tác",
            render: (r) => (
              <div className="flex items-center gap-1">
                <ActionViewButton
                  label="Xem chi tiết & Duyệt"
                  onClick={(e) => {
                    e.stopPropagation()
                    setDetail(r)
                    setReason("")
                  }}
                />
              </div>
            ),
          },
        ]}
      />

      {/* Modal chi tiết & phê duyệt */}
      <Modal
        open={!!detail}
        title="Chi tiết yêu cầu phê duyệt"
        onClose={() => !processing && setDetail(null)}
        footer={
          <div className="flex items-center justify-end w-full gap-2">
            <CancelButton
              disabled={processing}
              onClick={() => setDetail(null)}
            >
              Đóng
            </CancelButton>
            <Button
              variant="danger"
              disabled={processing}
              loading={processing}
              onClick={handleReject}
            >
              <XCircle className="size-4 mr-1" />
              Từ chối
            </Button>
            <ConfirmButton
              disabled={processing}
              loading={processing}
              onClick={handleApprove}
            >
              Phê duyệt
            </ConfirmButton>
          </div>
        }
      >
        <div className="space-y-4 text-xs text-slate-600">
          <div className="grid grid-cols-2 gap-3 rounded-lg bg-slate-50 border border-slate-200 p-4">
            <div>
              <span className="text-slate-400 block text-[11px]">Loại đối tượng</span>
              <p className="font-medium text-slate-800 mt-0.5">{detail?.typeName}</p>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Mã định danh</span>
              <code className="text-slate-800 font-mono mt-0.5 block">{detail?.code}</code>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Tên / Tiêu đề</span>
              <p className="font-medium text-slate-800 mt-0.5">{detail?.name}</p>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Người gửi yêu cầu</span>
              <p className="font-medium text-slate-800 mt-0.5">{detail?.owner}</p>
            </div>
            <div className="col-span-2 border-t border-slate-200 pt-2">
              <span className="text-slate-400 block text-[11px]">Thông tin bổ sung</span>
              <p className="text-slate-700 mt-0.5">{detail?.description || "—"}</p>
            </div>
          </div>

          <div>
            <Textarea
              label="Ghi chú xử lý / Lý do (bắt buộc khi từ chối)"
              placeholder="Nhập nhận xét hoặc lý do xử lý..."
              value={reason}
              maxLength={1000}
              onChange={(e) => setReason(e.target.value)}
              disabled={processing}
            />
          </div>
        </div>
      </Modal>
    </>
  )
}
