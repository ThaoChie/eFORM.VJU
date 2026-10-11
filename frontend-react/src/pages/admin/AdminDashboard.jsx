import { AlertTriangle, ArrowRight, CheckCircle2 } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"
import { toast } from "react-hot-toast"
import StatCard from "../../components/ui/StatCard"
import { Button, Card, PageTitle } from "../../components/ui/Primitives"
import { client } from "../../lib/axios/client"

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true)
      try {
        const res = await client.get("/dashboard/admin")
        setData(res)
      } catch (err) {
        toast.error("Lỗi khi tải dữ liệu tổng quan")
      } finally {
        setLoading(false)
      }
    }
    fetchDashboard()
  }, [])

  if (loading) {
    return <div className="p-8 text-center text-muted">Đang tải dữ liệu tổng quan...</div>
  }

  const totalStudents = data?.totalStudents != null ? Number(data.totalStudents).toLocaleString("vi-VN") : "0"
  const pendingApprovals = data?.pendingApprovals != null ? Number(data.pendingApprovals).toLocaleString("vi-VN") : "0"
  const completedForms = data?.completedForms != null ? Number(data.completedForms).toLocaleString("vi-VN") : "0"
  const completionRate = data?.completionRate != null ? `${data.completionRate}%` : "0%"
  const warnings = data?.warnings || []
  const departmentProgress = data?.departmentProgress || []

  return (
    <>
      <PageTitle
        title="Tổng quan Phòng Đào tạo"
        description="Theo dõi cấu hình và tiến độ điểm rèn luyện toàn trường."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Sinh viên toàn trường" value={totalStudents} />
        <StatCard label="Yêu cầu chờ duyệt" value={pendingApprovals} />
        <StatCard label="Phiếu đã hoàn tất" value={completedForms} />
        <StatCard label="Tỷ lệ hoàn thành" value={completionRate} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-slate-800">Yêu cầu chờ duyệt</h2>
              <p className="mt-1 text-sm text-muted">
                {pendingApprovals} bản ghi cấu hình và phiếu duyệt đang chờ xử lý.
              </p>
            </div>
            <Button
              variant="primary"
              onClick={() => navigate("/admin/pending")}
            >
              Đi duyệt <ArrowRight className="size-4" />
            </Button>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">Cảnh báo danh bạ</h2>
            <span className="text-xs text-muted">{warnings.length} cảnh báo</span>
          </div>
          <div className="mt-3 space-y-2">
            {warnings.length === 0 ? (
              <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                Hệ thống danh bạ đầy đủ, không có cảnh báo nào.
              </div>
            ) : (
              warnings.slice(0, 5).map((text) => (
                <button
                  key={text}
                  onClick={() => navigate("/admin/directory")}
                  className="flex w-full items-center gap-2 rounded-lg border border-brand-line bg-brand-soft p-3 text-left text-sm hover:border-brand transition-colors"
                >
                  <AlertTriangle className="size-4 shrink-0 text-brand" />
                  {text}
                </button>
              ))
            )}
          </div>
        </Card>
      </div>

      <Card className="mt-4">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <h2 className="font-semibold text-slate-800">Tiến độ toàn trường</h2>
          <span className="text-xs text-muted">Theo từng khoa đào tạo</span>
        </div>
        <div className="mt-5 space-y-4">
          {departmentProgress.length === 0 ? (
            <p className="text-sm text-muted text-center py-4">Chưa có dữ liệu tiến độ theo khoa.</p>
          ) : (
            departmentProgress.map((dept) => {
              const v = dept.progressPercent || 0
              return (
                <div
                  key={dept.departmentId || dept.departmentName}
                  className="grid grid-cols-[160px_1fr_60px] items-center gap-3 text-xs"
                >
                  <span className="font-medium text-slate-700 truncate" title={dept.departmentName}>
                    {dept.departmentName}
                  </span>
                  <span className="h-3 rounded-full bg-line overflow-hidden">
                    <span
                      className={`block h-full rounded-full transition-all duration-300 ${
                        v < 60 ? "bg-brand" : "bg-night"
                      }`}
                      style={{ width: `${Math.min(100, Math.max(0, v))}%` }}
                    />
                  </span>
                  <b className="text-right text-slate-800">{v}%</b>
                </div>
              )
            })
          )}
        </div>
      </Card>
    </>
  )
}
