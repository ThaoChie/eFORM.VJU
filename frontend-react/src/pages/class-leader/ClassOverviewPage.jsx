import { FileDown } from "lucide-react"
import StatCard from "../../components/ui/StatCard"
import StatusTag from "../../components/ui/StatusTag"
import { Button, Card, PageTitle, Table } from "../../components/ui/Primitives"

const students = [
  "Trần Minh Anh",
  "Lê Hoàng Nam",
  "Ngô Thùy Dương",
  "Đỗ Gia Bảo",
  "Phan Hải Yến",
  "Trương Quốc Việt",
]
export default function ClassOverviewPage() {
  const rows = students.map((name, i) => ({
    id: i,
    name,
    code: `23110${120 + i}`,
    class: "BCSE2023",
    score: 91 - i * 5,
    rank: ["Xuất sắc", "Tốt", "Tốt", "Khá", "Khá", "Trung bình"][i],
    status: [
      "Hoàn tất",
      "Chờ khoa duyệt",
      "Chờ lớp duyệt",
      "Hoàn tất",
      "Đã chuyển trả",
      "Soạn thảo",
    ][i],
  }))
  return (
    <>
      <PageTitle
        title="Tổng quan lớp BCSE2023"
        description="Học kỳ 1, năm học 2026-2027"
        action={
          <Button>
            <FileDown className="size-4" />
            Xuất Excel
          </Button>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Tổng sinh viên" value="65" />
        <StatCard label="Đã hoàn tất" value="18" note="27,7% sĩ số" />
        <StatCard label="Chờ duyệt" value="29" />
        <StatCard label="Điểm ĐRL trung bình" value="78,4" />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="font-semibold">Tiến độ nộp và duyệt</h2>
          <div className="mt-5 flex h-4 overflow-hidden rounded-full bg-line">
            <span className="w-[10%] bg-disabled" />
            <span className="w-[19%] bg-muted" />
            <span className="w-[35%] bg-night" />
            <span className="w-[28%] bg-[#374151]" />
            <span className="w-[8%] bg-brand" />
          </div>
          <div className="mt-4 grid grid-cols-5 gap-2 text-center text-xs">
            <span>
              Chưa nộp
              <br />
              <b>6</b>
            </span>
            <span>
              Chờ lớp
              <br />
              <b>12</b>
            </span>
            <span>
              Chờ khoa
              <br />
              <b>23</b>
            </span>
            <span>
              Hoàn tất
              <br />
              <b>18</b>
            </span>
            <span className="text-brand">
              Trả lại
              <br />
              <b>6</b>
            </span>
          </div>
        </Card>
        <Card>
          <h2 className="font-semibold">Phân bố xếp loại</h2>
          <div className="mt-5 flex h-28 items-end justify-around gap-3">
            {[42, 78, 100, 61, 28, 15].map((v, i) => (
              <div
                key={i}
                className="flex h-full flex-1 flex-col justify-end text-center"
              >
                <span className="text-xs">{v}%</span>
                <span className="mt-1 bg-muted" style={{ height: `${v}%` }} />
                <span className="mt-1 truncate text-[10px] text-muted">
                  {["XS", "Tốt", "Khá", "TB", "Yếu", "Kém"][i]}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
      <div className="mt-4">
        <Table
          rows={rows}
          columns={[
            { key: "stt", title: "STT", render: (_, i) => i + 1 },
            { key: "name", title: "Họ tên" },
            { key: "code", title: "Mã sinh viên" },
            { key: "class", title: "Lớp" },
            { key: "score", title: "Tổng điểm" },
            { key: "rank", title: "Xếp loại" },
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
