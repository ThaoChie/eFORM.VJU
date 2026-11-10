import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Layers, ArrowRight, RefreshCw } from "lucide-react"
import { ActionViewButton, Button, Card, PageTitle, Table } from "../../components/ui/Primitives"
import { batchService } from "../../services/batch-service"

export default function BatchListPage() {
  const navigate = useNavigate()
  const [batches, setBatches] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchBatches = async () => {
    setLoading(true)
    try {
      const data = await batchService.list()
      setBatches(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error("Lỗi khi tải danh sách lô lớp:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBatches()
  }, [])

  const totalPending = batches.reduce((sum, b) => sum + Number(b.pending || 0), 0)

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <PageTitle
          title="Duyệt phiếu khoa"
          description="Mỗi lô tương ứng với một lớp đã qua duyệt thẩm định cấp lớp và chuyển lên Khoa."
        />
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={fetchBatches} disabled={loading}>
            <RefreshCw className={`size-4 mr-1 ${loading ? "animate-spin" : ""}`} />
            Làm mới
          </Button>
          {totalPending > 0 && (
            <Button
              variant="primary"
              className="bg-brand text-white"
              onClick={() => navigate("/dean/batches/all")}
            >
              Xét duyệt toàn bộ ({totalPending} phiếu chờ ký) <ArrowRight className="size-4 ml-1" />
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <Card className="p-12 text-center text-muted">
          <div className="animate-spin inline-block size-8 border-3 border-brand border-t-transparent rounded-full mb-3" />
          <p className="text-sm">Đang tải danh sách các lô lớp trực thuộc Khoa...</p>
        </Card>
      ) : batches.length === 0 ? (
        <Card className="p-12 text-center text-muted">
          <Layers className="mx-auto size-12 text-slate-300 mb-3" />
          <h3 className="text-base font-semibold text-slate-700">Chưa có lô lớp nào</h3>
          <p className="text-sm text-slate-500 mt-1">Hiện chưa có lớp nào có phiếu được nộp hoặc chuyển lên cấp Khoa.</p>
        </Card>
      ) : (
        <Table
          rows={batches}
          columns={[
            {
              key: "class",
              title: "Lớp",
              render: (r) => (
                <div>
                  <span className="font-semibold text-slate-900 text-sm block">
                    {r.className || r.classCode}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    {r.classCode || `Lớp #${r.id}`}
                  </span>
                </div>
              ),
            },
            {
              key: "size",
              title: "Sĩ số",
              render: (r) => (
                <span className="text-sm text-slate-700">
                  {r.size || 0} SV
                </span>
              ),
            },
            {
              key: "pending",
              title: "Chờ khoa ký",
              render: (r) => (
                <span
                  className={`text-sm ${
                    r.pending > 0 ? "font-semibold text-rose-600" : "text-slate-500"
                  }`}
                >
                  {r.pending || 0} phiếu
                </span>
              ),
            },
            {
              key: "done",
              title: "Đã hoàn tất",
              render: (r) => (
                <span
                  className={`text-sm ${
                    r.done > 0 ? "font-semibold text-emerald-600" : "text-slate-500"
                  }`}
                >
                  {r.done || 0} phiếu
                </span>
              ),
            },
            {
              key: "reviewer",
              title: "Người duyệt cấp lớp",
              render: (r) => (
                <span className="text-sm text-slate-700">
                  {r.reviewer || "Cán bộ lớp"}
                </span>
              ),
            },
            {
              key: "status",
              title: "Trạng thái",
              render: (r) => {
                const status =
                  r.status ||
                  (r.pending > 0 ? "Chờ khoa duyệt" : r.done > 0 ? "Hoàn tất" : "Chưa có phiếu")
                const isPending = status.includes("Chờ") || r.pending > 0
                const isDone = status.includes("Hoàn tất") || status.includes("Đã duyệt")

                return (
                  <div className="flex items-center gap-2 text-sm">
                    <span
                      className={`size-1.5 rounded-full shrink-0 ${
                        isPending
                          ? "bg-amber-500"
                          : isDone
                            ? "bg-emerald-500"
                            : "bg-slate-300"
                      }`}
                    />
                    <span
                      className={
                        isPending
                          ? "font-medium text-amber-700"
                          : isDone
                            ? "font-medium text-emerald-700"
                            : "text-slate-500"
                      }
                    >
                      {status}
                    </span>
                  </div>
                )
              },
            },
            {
              key: "action",
              title: "Thao tác",
              render: (r) => (
                <div className="flex items-center gap-1">
                  <ActionViewButton
                    label="Mở xét duyệt lô"
                    onClick={() => navigate(`/dean/batches/${r.id}`)}
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
