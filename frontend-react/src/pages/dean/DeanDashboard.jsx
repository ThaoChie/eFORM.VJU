import { ArrowRight } from "lucide-react"
import { useNavigate } from "react-router-dom"
import StatCard from "../../components/ui/StatCard"
import { Button, Card, PageTitle } from "../../components/ui/Primitives"

export default function DeanDashboard() {
  const navigate = useNavigate()
  const classes = [
    ["BCSE2024", 42, true],
    ["D21CQCN01-B", 58, true],
    ["BCSE2023", 78, false],
    ["SE2022-A", 91, false],
    ["AI2023", 84, false],
  ]
  return (
    <>
      <PageTitle
        title="Tổng quan Khoa Công nghệ thông tin"
        description="Học kỳ 1, năm học 2026-2027"
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Tổng sinh viên" value="1.850" />
        <StatCard label="Phiếu chờ khoa ký" value="126" />
        <StatCard label="Lô chờ ký" value="3" />
        <StatCard label="Hoàn tất" value="1.247" />
      </div>
      <Card className="mt-4 flex flex-wrap items-center gap-3">
        <div>
          <h2 className="font-semibold">Việc cần làm</h2>
          <p className="mt-1 text-sm text-muted">
            3 lô lớp đã hoàn tất duyệt cấp lớp và sẵn sàng ký.
          </p>
        </div>
        <Button
          variant="primary"
          className="ml-auto"
          onClick={() => navigate("/dean/batches")}
        >
          Đi duyệt <ArrowRight className="size-4" />
        </Button>
      </Card>
      <div className="mt-4 grid gap-4 lg:grid-cols-[1.3fr_.7fr]">
        <Card>
          <h2 className="font-semibold">Tiến độ hoàn thành theo lớp</h2>
          <div className="mt-5 space-y-4">
            {classes.map(([name, value, slow]) => (
              <div
                key={name}
                className="grid grid-cols-[100px_1fr_40px] items-center gap-3 text-xs"
              >
                <span className={slow ? "font-semibold text-brand" : ""}>
                  {name}
                </span>
                <span className="h-3 overflow-hidden rounded-full bg-line">
                  <span
                    className={`block h-full ${slow ? "bg-brand" : "bg-night"}`}
                    style={{ width: `${value}%` }}
                  />
                </span>
                <b>{value}%</b>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <h2 className="font-semibold">Danh sách cảnh báo</h2>
          {[
            ["Nguyễn Thu Hà", "34 · Kém"],
            ["Đỗ Minh Quân", "39 · Yếu"],
            ["Lê Quốc Huy", "31 · Kém"],
          ].map(([n, s]) => (
            <div key={n} className="border-b border-line py-3 last:border-0">
              <p className="font-medium">{n}</p>
              <p className="text-xs text-brand">{s}</p>
            </div>
          ))}
        </Card>
      </div>
    </>
  )
}
