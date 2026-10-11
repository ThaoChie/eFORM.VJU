import { FileDown } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "react-hot-toast"
import StatCard from "../../components/ui/StatCard"
import StatusTag from "../../components/ui/StatusTag"
import { Button, Card, PageTitle, Table } from "../../components/ui/Primitives"
import { client } from "../../lib/axios/client"

export default function ClassOverviewPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchClassOverview = async () => {
      setLoading(true)
      try {
        const res = await client.get("/dashboard/class-leader")
        setData(res)
      } catch (err) {
        toast.error("Lỗi khi tải dữ liệu tổng quan lớp")
      } finally {
        setLoading(false)
      }
    }
    fetchClassOverview()
  }, [])

  if (loading) {
    return <div className="p-8 text-center text-muted">Đang tải dữ liệu tổng quan lớp...</div>
  }

  const totalStudents = data?.totalStudents || 0
  const completedCount = data?.completedCount || 0
  const pendingCount = data?.pendingCount || 0
  const averageScore = data?.averageScore > 0 ? data.averageScore.toFixed(1) : "—"
  const completedRate = totalStudents > 0 ? ((completedCount * 100) / totalStudents).toFixed(1) : "0"

  const pb = data?.progressBreakdown || { notSubmitted: 0, waitingClass: 0, waitingDean: 0, completed: 0, rejected: 0 }
  const totalBar = Math.max(1, pb.notSubmitted + pb.waitingClass + pb.waitingDean + pb.completed + pb.rejected)

  const rankingDistribution = data?.rankingDistribution || [
    { label: "XS", percent: 0 },
    { label: "Tốt", percent: 0 },
    { label: "Khá", percent: 0 },
    { label: "TB", percent: 0 },
    { label: "Yếu", percent: 0 },
    { label: "Kém", percent: 0 }
  ]

  const students = data?.students || []

  const handleExport = () => {
    toast.success("Đang xuất danh sách sinh viên...")
    try {
      let csvContent = "data:text/csv;charset=utf-8,STT,Mã sinh viên,Họ tên,Lớp,Tổng điểm,Xếp loại,Trạng thái\n"
      students.forEach((s, i) => {
        csvContent += `${i + 1},${s.code},"${s.name}",${s.className},${s.score || ""},"${s.rank}","${s.status}"\n`
      })
      const encodedUri = encodeURI(csvContent)
      const link = document.createElement("a")
      link.setAttribute("href", encodedUri)
      link.setAttribute("download", `Danh_sach_DRL_${data?.classCode || "lop"}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (e) {
      toast.error("Lỗi xuất tệp")
    }
  }

  return (
    <>
      <PageTitle
        title={`Tổng quan lớp ${data?.classCode || "BCSE2023"}`}
        description={data?.semesterName || "Học kỳ 1, năm học 2026-2027"}
        action={
          <Button onClick={handleExport}>
            <FileDown className="size-4" />
            Xuất Excel
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Tổng sinh viên" value={totalStudents} />
        <StatCard label="Đã hoàn tất" value={completedCount} note={`${completedRate}% sĩ số`} />
        <StatCard label="Chờ duyệt" value={pendingCount} />
        <StatCard label="Điểm ĐRL trung bình" value={averageScore} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="font-semibold text-slate-800">Tiến độ nộp và duyệt</h2>
          <div className="mt-5 flex h-4 overflow-hidden rounded-full bg-line">
            <span
              title={`Chưa nộp: ${pb.notSubmitted}`}
              style={{ width: `${(pb.notSubmitted * 100) / totalBar}%` }}
              className="bg-disabled transition-all"
            />
            <span
              title={`Chờ lớp: ${pb.waitingClass}`}
              style={{ width: `${(pb.waitingClass * 100) / totalBar}%` }}
              className="bg-muted transition-all"
            />
            <span
              title={`Chờ khoa: ${pb.waitingDean}`}
              style={{ width: `${(pb.waitingDean * 100) / totalBar}%` }}
              className="bg-night transition-all"
            />
            <span
              title={`Hoàn tất: ${pb.completed}`}
              style={{ width: `${(pb.completed * 100) / totalBar}%` }}
              className="bg-emerald-600 transition-all"
            />
            <span
              title={`Trả lại: ${pb.rejected}`}
              style={{ width: `${(pb.rejected * 100) / totalBar}%` }}
              className="bg-brand transition-all"
            />
          </div>
          <div className="mt-4 grid grid-cols-5 gap-2 text-center text-xs">
            <span>
              Chưa nộp
              <br />
              <b className="text-slate-800 text-sm">{pb.notSubmitted}</b>
            </span>
            <span>
              Chờ lớp
              <br />
              <b className="text-slate-800 text-sm">{pb.waitingClass}</b>
            </span>
            <span>
              Chờ khoa
              <br />
              <b className="text-slate-800 text-sm">{pb.waitingDean}</b>
            </span>
            <span>
              Hoàn tất
              <br />
              <b className="text-emerald-700 text-sm">{pb.completed}</b>
            </span>
            <span className="text-brand">
              Trả lại
              <br />
              <b className="text-sm">{pb.rejected}</b>
            </span>
          </div>
        </Card>

        <Card>
          <h2 className="font-semibold text-slate-800">Phân bố xếp loại</h2>
          <div className="mt-5 flex h-28 items-end justify-around gap-3">
            {rankingDistribution.map((item, i) => {
              const v = Math.min(100, Math.max(0, item.percent || 0))
              return (
                <div
                  key={item.label || i}
                  className="flex h-full flex-1 flex-col justify-end text-center"
                >
                  <span className="text-xs font-semibold text-slate-700">{v}%</span>
                  <span
                    className="mt-1 bg-muted rounded-t transition-all duration-300"
                    style={{ height: `${Math.max(4, v)}%` }}
                  />
                  <span className="mt-1 truncate text-[11px] font-medium text-muted">
                    {item.label}
                  </span>
                </div>
              )
            })}
          </div>
        </Card>
      </div>

      <div className="mt-4">
        <Table
          rows={students}
          columns={[
            { key: "stt", title: "STT", render: (_, i) => i + 1 },
            { key: "name", title: "Họ tên" },
            { key: "code", title: "Mã sinh viên", render: (r) => <span className="font-mono text-xs">{r.code}</span> },
            { key: "className", title: "Lớp", render: (r) => r.className },
            { key: "score", title: "Tổng điểm", render: (r) => r.score != null ? <span className="font-semibold">{r.score}</span> : "—" },
            { key: "rank", title: "Xếp loại", render: (r) => r.rank || "—" },
            {
              key: "status",
              title: "Trạng thái",
              render: (r) => <StatusTag status={r.status} />,
            },
          ]}
        />
      </div>
    </>
  )
}
