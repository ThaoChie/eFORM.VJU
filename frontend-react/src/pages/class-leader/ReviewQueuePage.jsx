import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useReviewStore } from "../../stores/useReviewStore"
import StatusTag from "../../components/ui/StatusTag"
import { Button, PageTitle, Table } from "../../components/ui/Primitives"

export default function ReviewQueuePage() {
  const navigate = useNavigate()
  const { items, loading, load } = useReviewStore()
  useEffect(() => {
    load()
  }, [load])
  return (
    <>
      <PageTitle
        title="Duyệt phiếu lớp"
        description="Phiếu của chính bạn không xuất hiện trong hàng đợi."
      />
      <div className="mb-4 flex gap-1 border-b border-line">
        <button className="border-b-2 border-brand px-4 py-3 font-medium text-brand">
          Đang chờ duyệt ({items.length})
        </button>
        <button className="px-4 py-3 text-muted">Đã xử lý</button>
      </div>
      {loading ? (
        <div className="rounded-lg border border-line bg-white p-12 text-center text-muted">
          Đang tải dữ liệu...
        </div>
      ) : (
        <Table
          rows={items}
          onRow={(r) => navigate(`/class-leader/review/${r.id}`)}
          columns={[
            { key: "stt", title: "STT", render: (_, i) => i + 1 },
            {
              key: "name",
              title: "Sinh viên",
              render: (r) => (
                <span>
                  {r.name}
                  {r.draft && (
                    <small className="ml-2 rounded-full bg-canvas px-2 py-1 text-muted">
                      Đang chấm dở
                    </small>
                  )}
                </span>
              ),
            },
            { key: "code", title: "Mã SV" },
            { key: "submitted", title: "Ngày nộp" },
            { key: "score", title: "Tổng điểm SV" },
            {
              key: "status",
              title: "Trạng thái",
              render: () => <StatusTag status="Chờ lớp duyệt" />,
            },
            {
              key: "action",
              title: "Thao tác",
              render: (r) => (
                <Button
                  onClick={() => navigate(`/class-leader/review/${r.id}`)}
                >
                  Duyệt
                </Button>
              ),
            },
          ]}
        />
      )}
    </>
  )
}
