import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useReviewStore } from "../../stores/useReviewStore"
import StatusTag from "../../components/ui/StatusTag"
import { ActionViewButton, Button, PageTitle, Table } from "../../components/ui/Primitives"
import { Inbox, RefreshCw } from "lucide-react"

export default function ReviewQueuePage() {
  const navigate = useNavigate()
  const { items, loading, load } = useReviewStore()

  useEffect(() => {
    load()
  }, [load])

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PageTitle
          title="Duyệt phiếu lớp"
          description="Danh sách phiếu tự đánh giá ĐRL của sinh viên đang chờ ban cán sự lớp phê duyệt."
        />
        <Button
          variant="secondary"
          onClick={() => load()}
          loading={loading}
          className="text-xs"
        >
          <RefreshCw className="size-3.5 mr-1" />
          Làm mới
        </Button>
      </div>

      <div className="mb-4 flex gap-1 border-b border-line">
        <button className="border-b-2 border-brand px-4 py-3 font-semibold text-brand text-sm flex items-center gap-2">
          <span>Đang chờ duyệt</span>
          <span className="rounded-full bg-brand-soft px-2 py-0.5 text-xs font-bold text-brand">
            {items.length}
          </span>
        </button>
      </div>

      {loading ? (
        <div className="rounded-lg border border-line bg-white p-12 text-center text-muted">
          <div className="animate-spin inline-block size-6 border-2 border-brand border-t-transparent rounded-full mb-3" />
          <p>Đang tải danh sách phiếu chờ duyệt...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-line bg-white p-12 text-center text-muted shadow-2xs">
          <Inbox className="mx-auto size-12 text-slate-300 mb-3" />
          <h3 className="text-base font-semibold text-slate-700">Hàng đợi trống</h3>
          <p className="mt-1 text-sm text-slate-500">
            Hiện không có phiếu rèn luyện nào đang ở trạng thái chờ lớp duyệt.
          </p>
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
                <div>
                  <span className="font-semibold text-slate-800">{r.name}</span>
                  {r.className && (
                    <small className="block text-slate-400 text-xs">
                      {r.className}
                    </small>
                  )}
                </div>
              ),
            },
            { key: "code", title: "Mã SV", render: (r) => <span className="font-mono text-xs">{r.code}</span> },
            { key: "submitted", title: "Ngày nộp" },
            {
              key: "score",
              title: "Tổng điểm SV",
              render: (r) => (
                <span className="font-mono font-bold text-slate-800">
                  {r.score}đ
                </span>
              ),
            },
            {
              key: "status",
              title: "Trạng thái",
              render: (r) => <StatusTag status={r.status} />,
            },
            {
              key: "action",
              title: "Thao tác",
              render: (r) => (
                <div className="flex items-center gap-1">
                  <ActionViewButton
                    label="Thẩm định phiếu"
                    onClick={(e) => {
                      e.stopPropagation()
                      navigate(`/class-leader/review/${r.id}`)
                    }}
                  />
                </div>
              ),
            },
          ]}
        />
      )}
    </>
  )
}
