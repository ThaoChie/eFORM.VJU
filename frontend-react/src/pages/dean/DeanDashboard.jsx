import { ArrowRight, CheckCircle2 } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"
import { toast } from "react-hot-toast"
import StatCard from "../../components/ui/StatCard"
import { Button, Card, PageTitle } from "../../components/ui/Primitives"
import { client } from "../../lib/axios/client"

export default function DeanDashboard() {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDeanDashboard = async () => {
      setLoading(true)
      try {
        const res = await client.get("/dashboard/dean")
        setData(res)
      } catch (err) {
        toast.error("Lỗi khi tải dữ liệu tổng quan khoa")
      } finally {
        setLoading(false)
      }
    }
    fetchDeanDashboard()
  }, [])

  if (loading) {
    return <div className="p-8 text-center text-muted">Đang tải dữ liệu tổng quan khoa...</div>
  }

  const totalStudents = data?.totalStudents != null ? Number(data.totalStudents).toLocaleString("vi-VN") : "0"
  const pendingForms = data?.pendingForms != null ? Number(data.pendingForms).toLocaleString("vi-VN") : "0"
  const pendingBatches = data?.pendingBatches != null ? Number(data.pendingBatches).toLocaleString("vi-VN") : "0"
  const completedForms = data?.completedForms != null ? Number(data.completedForms).toLocaleString("vi-VN") : "0"
  const classesProgress = data?.classesProgress || []
  const warningStudents = data?.warningStudents || []

  return (
    <>
      <PageTitle
        title={`Tổng quan ${data?.departmentName ? "Khoa " + data.departmentName : "Khoa đào tạo"}`}
        description={data?.semesterName || "Học kỳ 1, năm học 2026-2027"}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Tổng sinh viên" value={totalStudents} />
        <StatCard label="Phiếu chờ khoa ký" value={pendingForms} />
        <StatCard label="Lô chờ ký" value={pendingBatches} />
        <StatCard label="Hoàn tất" value={completedForms} />
      </div>

      <Card className="mt-4 flex flex-wrap items-center gap-3">
        <div>
          <h2 className="font-semibold text-slate-800">Việc cần làm</h2>
          <p className="mt-1 text-sm text-muted">
            {pendingBatches > 0 
              ? `${pendingBatches} lớp đã hoàn tất duyệt cấp lớp và sẵn sàng ký duyệt.`
              : "Hiện chưa có lô lớp nào đang chờ Trưởng khoa ký duyệt."}
          </p>
        </div>
        <Button
          variant="primary"
          className="ml-auto"
          disabled={pendingBatches === 0}
          onClick={() => navigate("/dean/batches")}
        >
          Đi duyệt <ArrowRight className="size-4" />
        </Button>
      </Card>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.3fr_.7fr]">
        <Card>
          <div className="flex items-center justify-between border-b border-line pb-3">
            <h2 className="font-semibold text-slate-800">Tiến độ hoàn thành theo lớp</h2>
            <span className="text-xs text-muted">{classesProgress.length} lớp trực thuộc</span>
          </div>
          <div className="mt-5 space-y-4">
            {classesProgress.length === 0 ? (
              <p className="text-sm text-muted text-center py-4">Chưa có lớp nào trực thuộc khoa.</p>
            ) : (
              classesProgress.map((cls) => {
                const value = cls.progressPercent || 0
                const slow = cls.slow
                return (
                  <div
                    key={cls.classId || cls.classCode}
                    className="grid grid-cols-[120px_1fr_50px] items-center gap-3 text-xs"
                  >
                    <span className={slow ? "font-semibold text-brand truncate" : "truncate text-slate-700"} title={cls.classCode}>
                      {cls.classCode}
                    </span>
                    <span className="h-3 overflow-hidden rounded-full bg-line">
                      <span
                        className={`block h-full transition-all duration-300 ${slow ? "bg-brand" : "bg-night"}`}
                        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
                      />
                    </span>
                    <b className="text-right text-slate-800">{value}%</b>
                  </div>
                )
              })
            )}
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between border-b border-line pb-3">
            <h2 className="font-semibold text-slate-800">Danh sách cảnh báo</h2>
            <span className="text-xs text-muted">{warningStudents.length} sinh viên</span>
          </div>
          <div className="mt-3">
            {warningStudents.length === 0 ? (
              <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
                <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                Tất cả sinh viên đều đạt tiến độ điểm chuẩn.
              </div>
            ) : (
              warningStudents.slice(0, 6).map((st) => (
                <div key={st.id || st.code} className="border-b border-line py-2.5 last:border-0 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm text-slate-800">{st.name}</p>
                    <p className="text-xs text-muted">{st.code} · {st.className}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-brand">{st.score != null ? `${st.score} điểm` : "Chưa có điểm"}</p>
                    <p className="text-[11px] text-muted">{st.ranking || st.status}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </>
  )
}
