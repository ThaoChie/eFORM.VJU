import { AlertTriangle, ArrowRight } from "lucide-react"
import { useNavigate } from "react-router-dom"
import StatCard from "../../components/ui/StatCard"
import { Button, Card, PageTitle } from "../../components/ui/Primitives"

export default function AdminDashboard() {
  const navigate = useNavigate()
  return (
    <>
      <PageTitle
        title="Tổng quan Phòng Đào tạo"
        description="Theo dõi cấu hình và tiến độ điểm rèn luyện toàn trường."
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Sinh viên toàn trường" value="8.420" />
        <StatCard label="Yêu cầu chờ duyệt" value="6" />
        <StatCard label="Phiếu đã hoàn tất" value="6.185" />
        <StatCard label="Tỷ lệ hoàn thành" value="73,5%" />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold">Yêu cầu chờ duyệt</h2>
              <p className="mt-1 text-sm text-muted">
                6 bản ghi cấu hình của Admin khác đang chờ bạn.
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
          <h2 className="font-semibold">Cảnh báo danh bạ</h2>
          <div className="mt-3 space-y-2">
            {[
              "Lớp BCSE2024 chưa có Lớp phó",
              "Khoa Cơ khí chưa chỉ định Trưởng khoa",
              "3 người dùng giữ chức vụ nhưng chưa có chữ ký",
            ].map((text) => (
              <button
                key={text}
                className="flex w-full items-center gap-2 rounded-lg border border-brand-line bg-brand-soft p-3 text-left text-sm hover:border-brand"
              >
                <AlertTriangle className="size-4 shrink-0 text-brand" />
                {text}
              </button>
            ))}
          </div>
        </Card>
      </div>
      <Card className="mt-4">
        <h2 className="font-semibold">Tiến độ toàn trường</h2>
        <div className="mt-5 space-y-4">
          {[
            ["Công nghệ thông tin", 78],
            ["Kinh tế", 72],
            ["Cơ khí", 51],
            ["Ngoại ngữ", 86],
          ].map(([name, v]) => (
            <div
              key={name}
              className="grid grid-cols-[150px_1fr_50px] items-center gap-3 text-xs"
            >
              <span>{name}</span>
              <span className="h-3 rounded-full bg-line">
                <span
                  className={`block h-full rounded-full ${
                    v < 60 ? "bg-brand" : "bg-night"
                  }`}
                  style={{ width: `${v}%` }}
                />
              </span>
              <b>{v}%</b>
            </div>
          ))}
        </div>
      </Card>
    </>
  )
}
