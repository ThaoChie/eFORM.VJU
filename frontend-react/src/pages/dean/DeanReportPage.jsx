import { FileDown } from "lucide-react"
import {
  Button,
  FilterBar,
  Input,
  PageTitle,
  Select,
  Table,
} from "../../components/ui/Primitives"

export default function DeanReportPage({ school = false }) {
  const rows = Array.from({ length: 10 }, (_, i) => ({
    id: i,
    name: [
      "Nguyễn Văn An",
      "Trần Minh Anh",
      "Lê Hoàng Nam",
      "Ngô Thùy Dương",
      "Đỗ Gia Bảo",
    ][i % 5],
    code: `23110${101 + i}`,
    class: "BCSE2023",
    year: "K21",
    faculty: "Công nghệ thông tin",
    score: 72 + i * 2,
    rank: i > 7 ? "Xuất sắc" : i > 3 ? "Tốt" : "Khá",
  }))
  return (
    <>
      <PageTitle
        title={school ? "Báo cáo toàn trường" : "Báo cáo khoa"}
        description="Dữ liệu phiếu hoàn tất và đã khóa chứng nhận."
        action={
          <Button variant="primary">
            <FileDown className="size-4" />
            Xuất Excel báo cáo
          </Button>
        }
      />
      <FilterBar>
        <Input label="Mã sinh viên / Họ tên" placeholder="Nhập từ khóa" />
        <Select label="Lớp">
          <option>Tất cả lớp</option>
        </Select>
        {school && (
          <Select label="Khoa quản lý">
            <option>Tất cả khoa</option>
          </Select>
        )}
        <Select label="Học kỳ">
          <option>HK1, 2026-2027</option>
        </Select>
      </FilterBar>
      <Table
        rows={rows}
        columns={[
          { key: "stt", title: "STT", render: (_, i) => i + 1 },
          { key: "name", title: "Họ tên" },
          { key: "code", title: "Mã sinh viên" },
          { key: "class", title: "Lớp" },
          { key: "year", title: "Niên khóa" },
          { key: "faculty", title: "Khoa" },
          { key: "score", title: "Tổng điểm ĐRL" },
          { key: "rank", title: "Xếp loại" },
          {
            key: "pdf",
            title: "PDF biểu mẫu",
            render: () => (
              <button className="underline hover:text-brand">Xem PDF</button>
            ),
          },
        ]}
      />
    </>
  )
}
