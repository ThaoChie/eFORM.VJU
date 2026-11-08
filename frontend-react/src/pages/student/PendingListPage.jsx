import { Eye, Pencil, Clock } from "lucide-react"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useSubmissionStore } from "../../stores/useSubmissionStore"
import StatusTag from "../../components/ui/StatusTag"
import {
  ActionEditButton,
  ActionViewButton,
  FilterBar,
  Input,
  PageTitle,
  Select,
  Table,
} from "../../components/ui/Primitives"

export default function PendingListPage() {
  const navigate = useNavigate()
  const { status, scoreFormId, semester, lastSavedText, fetchFormData } = useSubmissionStore()
  const [activeTab, setActiveTab] = useState("PROCESSING") // "PROCESSING" | "WAITING"

  useEffect(() => {
    fetchFormData().catch(() => {})
  }, [fetchFormData])

  const statusLabelMap = {
    DRAFT: "Soạn thảo",
    REJECTED: "Bị từ chối",
    SUBMITTED: "Chờ lớp duyệt",
    CLASS_APPROVED: "Chờ khoa duyệt",
    FACULTY_APPROVED: "Đã duyệt",
  }

  const isProcessing = status === "DRAFT" || status === "REJECTED"
  const isWaiting = status === "SUBMITTED" || status === "CLASS_APPROVED"

  const allRows = scoreFormId ? [
    {
      id: String(scoreFormId),
      semester: semester?.semesterName || "HK1, 2026-2027",
      version: "DRL-2026 v1.0",
      score: status === "DRAFT" ? "—" : "Đã tự chấm",
      status: statusLabelMap[status] || status,
      rawStatus: status,
      updated: lastSavedText ? lastSavedText.replace("Đã lưu nháp lúc ", "Hôm nay, ") : "Gần đây",
    }
  ] : []

  const displayRows = allRows.filter((r) => {
    if (activeTab === "PROCESSING") return isProcessing
    if (activeTab === "WAITING") return isWaiting
    return true
  })

  return (
    <>
      <PageTitle
        title="Danh sách chờ xử lý"
        description="Theo dõi phiếu đang soạn và đang chờ các cấp duyệt."
      />

      <div className="mb-4 flex gap-1 border-b border-line">
        <button
          onClick={() => setActiveTab("PROCESSING")}
          className={`px-4 py-3 font-medium transition ${
            activeTab === "PROCESSING"
              ? "border-b-2 border-brand text-brand"
              : "text-muted hover:text-ink"
          }`}
        >
          1. Đang xử lý {isProcessing && <span className="ml-1.5 rounded-full bg-amber-100 text-amber-800 px-2 py-0.5 text-xs font-bold">1</span>}
        </button>
        <button
          onClick={() => setActiveTab("WAITING")}
          className={`px-4 py-3 font-medium transition ${
            activeTab === "WAITING"
              ? "border-b-2 border-brand text-brand"
              : "text-muted hover:text-ink"
          }`}
        >
          2. Đang chờ duyệt {isWaiting && <span className="ml-1.5 rounded-full bg-blue-100 text-blue-800 px-2 py-0.5 text-xs font-bold">1</span>}
        </button>
      </div>

      <FilterBar>
        <Select label="Học kỳ">
          <option>{semester?.semesterName || "Tất cả học kỳ"}</option>
        </Select>
        <Select label="Trạng thái">
          <option>Tất cả trạng thái</option>
        </Select>
        <Input label="Từ khóa" placeholder="Tên biểu mẫu" />
      </FilterBar>

      <Table
        rows={displayRows}
        columns={[
          { key: "stt", title: "STT", render: (_, i) => i + 1 },
          { key: "semester", title: "Học kỳ" },
          { key: "version", title: "Phiên bản biểu mẫu" },
          { key: "score", title: "Tổng điểm" },
          {
            key: "status",
            title: "Trạng thái",
            render: (r) => <StatusTag status={r.status} />,
          },
          { key: "updated", title: "Cập nhật lần cuối" },
          {
            key: "action",
            title: "Thao tác",
            render: (r) => (
              <div className="flex items-center gap-1">
                <ActionViewButton
                  label="Xem chi tiết phiếu"
                  onClick={() => navigate(`/student/compose/${r.id}`)}
                />
                {(r.rawStatus === "DRAFT" || r.rawStatus === "REJECTED") && (
                  <ActionEditButton
                    label="Tiếp tục soạn thảo"
                    onClick={() => navigate(`/student/compose/${r.id}`)}
                  />
                )}
              </div>
            ),
          },
        ]}
      />

      <div className="mt-3 flex justify-between text-xs text-muted">
        <span>Hiển thị {displayRows.length} bản ghi</span>
        <span>Trang 1 / 1</span>
      </div>
    </>
  )
}
