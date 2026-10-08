import { Eye, Pencil, Send } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useSubmissionStore } from "../../stores/useSubmissionStore"
import StatusTag from "../../components/ui/StatusTag"
import {
  Button,
  FilterBar,
  Input,
  PageTitle,
  Select,
  Table,
} from "../../components/ui/Primitives"

export default function PendingListPage() {
  const navigate = useNavigate()
  const status = useSubmissionStore((state) => state.status)
  const rows = [
    {
      id: "1",
      semester: "HK1, 2026-2027",
      version: "v2.0",
      score: status === "Soạn thảo" ? "—" : "82",
      status,
      updated: "Hôm nay, 09:41",
    },
  ]
  return (
    <>
      <PageTitle
        title="Danh sách chờ xử lý"
        description="Theo dõi phiếu đang soạn và đang chờ các cấp duyệt."
      />
      <div className="mb-4 flex gap-1 border-b border-line">
        <button className="border-b-2 border-brand px-4 py-3 font-medium text-brand">
          Đang xử lý
        </button>
        <button className="px-4 py-3 text-muted">Đang chờ duyệt</button>
      </div>
      <FilterBar>
        <Select label="Học kỳ">
          <option>Tất cả học kỳ</option>
        </Select>
        <Select label="Trạng thái">
          <option>Tất cả trạng thái</option>
        </Select>
        <Input label="Từ khóa" placeholder="Tên biểu mẫu" />
      </FilterBar>
      <Table
        rows={rows}
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
              <div className="flex">
                <button
                  title="Xem chi tiết"
                  onClick={() => navigate(`/student/submissions/${r.id}`)}
                  className="p-2 text-muted hover:text-ink"
                >
                  <Eye className="size-4" />
                </button>
                {r.status === "Soạn thảo" && (
                  <button
                    title="Sửa"
                    onClick={() => navigate("/student/compose/1")}
                    className="p-2 text-muted hover:text-ink"
                  >
                    <Pencil className="size-4" />
                  </button>
                )}
              </div>
            ),
          },
        ]}
      />
      <div className="mt-3 flex justify-between text-xs text-muted">
        <span>Hiển thị 1–1 trên 1</span>
        <span>Trang 1 / 1</span>
      </div>
    </>
  )
}
