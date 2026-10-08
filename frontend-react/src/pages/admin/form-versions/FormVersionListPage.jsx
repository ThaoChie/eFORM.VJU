import { Eye, Pencil, Plus } from "lucide-react"
import { useNavigate } from "react-router-dom"
import {
  Button,
  FilterBar,
  IconButton,
  Input,
  PageTitle,
  Select,
  Table,
} from "../../../components/ui/Primitives"

export default function FormVersionListPage({ fieldCodes = false }) {
  const navigate = useNavigate()
  const rows = Array.from({ length: 6 }, (_, i) =>
    fieldCodes
      ? {
          id: i,
          code: [
            "student_name",
            "student_code",
            "study_attendance",
            "proof_volunteer",
            "total_score",
            "signature_student",
          ][i],
          name: [
            "Họ tên sinh viên",
            "Mã sinh viên",
            "Điểm chuyên cần",
            "Minh chứng tình nguyện",
            "Tổng điểm",
            "Chữ ký sinh viên",
          ][i],
          group: i < 2 ? "COMMON" : "HEADER",
          type: ["STRING", "STRING", "NUMBER", "FILE", "NUMBER", "SIGNATURE"][
            i
          ],
          status: i === 5 ? "Vô hiệu hóa" : "Đang hoạt động",
        }
      : {
          id: i,
          form: "Phiếu ĐRL",
          code: `DRL-2026-v${i + 1}.0`,
          name: `Phiếu ĐRL 2026-2027 phiên bản ${i + 1}`,
          semester: "HK1 2026-2027",
          scope: i ? "Toàn hệ thống" : "Khoa CNTT",
          status:
            i === 0 ? "Hiệu lực" : i === 1 ? "Chờ hiệu lực" : "Hết hiệu lực",
        },
  )
  const base = fieldCodes ? "/admin/field-codes" : "/admin/form-versions"
  return (
    <>
      <PageTitle
        title={fieldCodes ? "Trường thông tin" : "Phiên bản biểu mẫu"}
        description={
          fieldCodes
            ? "Quản lý Field Code dùng để thiết kế biểu mẫu."
            : "Quản lý cấu hình và thời gian hiệu lực của biểu mẫu."
        }
        action={
          <Button variant="primary" onClick={() => navigate(`${base}/new`)}>
            <Plus className="size-4" />
            Thêm mới
          </Button>
        }
      />
      <FilterBar>
        <Input
          label={fieldCodes ? "Mã trường" : "Tên phiên bản"}
          placeholder="Nhập từ khóa"
        />
        <Select label="Trạng thái">
          <option>Tất cả trạng thái</option>
        </Select>
        <Select label={fieldCodes ? "Nhóm trường" : "Học kỳ áp dụng"}>
          <option>Tất cả</option>
        </Select>
      </FilterBar>
      <Table
        rows={rows}
        columns={
          fieldCodes
            ? [
                { key: "stt", title: "STT", render: (_, i) => i + 1 },
                {
                  key: "code",
                  title: "Mã trường",
                  render: (r) => <code>{r.code}</code>,
                },
                { key: "name", title: "Tên trường" },
                { key: "group", title: "Nhóm" },
                { key: "type", title: "Kiểu dữ liệu" },
                { key: "status", title: "Trạng thái" },
              ]
            : [
                { key: "stt", title: "STT", render: (_, i) => i + 1 },
                { key: "form", title: "Biểu mẫu" },
                {
                  key: "code",
                  title: "Mã phiên bản",
                  render: (r) => <code>{r.code}</code>,
                },
                { key: "name", title: "Tên phiên bản" },
                { key: "semester", title: "Học kỳ áp dụng" },
                { key: "scope", title: "Phạm vi" },
                { key: "status", title: "Trạng thái" },
                {
                  key: "action",
                  title: "Thao tác",
                  render: (r) => (
                    <div className="flex">
                      <IconButton
                        label="Xem chi tiết"
                        onClick={() => navigate(`${base}/${r.id}`)}
                      >
                        <Eye className="size-4" />
                      </IconButton>
                      <IconButton
                        label="Yêu cầu sửa"
                        onClick={() => navigate(`${base}/${r.id}/edit`)}
                      >
                        <Pencil className="size-4" />
                      </IconButton>
                    </div>
                  ),
                },
              ]
        }
      />
    </>
  )
}
