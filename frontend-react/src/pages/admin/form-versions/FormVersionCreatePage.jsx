import { ArrowLeft, Braces, Save } from "lucide-react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Button,
  Card,
  Input,
  Modal,
  PageTitle,
  Select,
  Textarea,
} from "../../../components/ui/Primitives"

export default function FormVersionCreatePage({ fieldCode = false }) {
  const navigate = useNavigate()
  const [confirm, setConfirm] = useState(false)
  const [description, setDescription] = useState("")
  return (
    <>
      <PageTitle
        title={fieldCode ? "Thêm trường thông tin" : "Thêm phiên bản biểu mẫu"}
        description="Hoàn thiện thông tin và đẩy duyệt theo quy trình Maker – Checker."
      />
      <div className="mx-auto max-w-4xl space-y-4">
        <Card>
          <h2 className="mb-4 font-semibold">Thông tin chung</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label={fieldCode ? "Mã trường Eform" : "Biểu mẫu"}
              required
              placeholder={
                fieldCode ? "field_code_snake_case" : "Phiếu điểm rèn luyện"
              }
            />
            <Input
              label={fieldCode ? "Tên trường" : "Mã phiên bản"}
              required
              placeholder={fieldCode ? "Tên hiển thị" : "DRL-2027-v1.0"}
            />
            <Select label={fieldCode ? "Nhóm trường" : "Học kỳ áp dụng"}>
              <option>{fieldCode ? "COMMON" : "HK1, 2026-2027"}</option>
              <option>{fieldCode ? "HEADER" : "HK2, 2026-2027"}</option>
            </Select>
            <Select label={fieldCode ? "Kiểu dữ liệu" : "Áp dụng cho"}>
              <option>{fieldCode ? "STRING" : "Toàn hệ thống"}</option>
              <option>{fieldCode ? "NUMBER" : "Đơn vị cụ thể"}</option>
            </Select>
          </div>
          <div className="mt-4">
            <Textarea
              label={fieldCode ? "Lý do yêu cầu" : "Mô tả"}
              value={description}
              maxLength={fieldCode ? 1000 : 512}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </Card>
        <Card>
          <h2 className="mb-3 font-semibold">
            {fieldCode ? "Quy tắc xác thực" : "Trường thông tin biểu mẫu"}
          </h2>
          <div className="rounded-lg border border-dashed border-disabled bg-canvas p-8 text-center text-muted">
            <Braces className="mx-auto mb-2 size-6" />
            Kéo thả Field Code và cấu hình quy tắc tại đây
            <Button className="mx-auto mt-4 block">Thêm phần tử</Button>
          </div>
        </Card>
        <Card>
          <Textarea
            label="Lý do yêu cầu"
            value={description}
            maxLength={1000}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Card>
        <div className="sticky bottom-0 flex justify-end gap-2 rounded-lg border border-line bg-white p-4">
          <Button onClick={() => navigate(-1)}>
            <ArrowLeft className="size-4" />
            Quay lại
          </Button>
          <Button>
            <Save className="size-4" />
            Lưu nháp
          </Button>
          <Button variant="primary" onClick={() => setConfirm(true)}>
            Đẩy duyệt
          </Button>
        </div>
      </div>
      <Modal
        open={confirm}
        title="Xác nhận đẩy duyệt"
        onClose={() => setConfirm(false)}
        footer={
          <>
            <Button onClick={() => setConfirm(false)}>Hủy</Button>
            <Button
              variant="primary"
              onClick={() => navigate("/admin/pending")}
            >
              Xác nhận
            </Button>
          </>
        }
      >
        <p>
          Bản ghi sẽ chuyển sang trạng thái Chờ duyệt và không thể chỉnh sửa cho
          tới khi được xử lý.
        </p>
      </Modal>
    </>
  )
}
