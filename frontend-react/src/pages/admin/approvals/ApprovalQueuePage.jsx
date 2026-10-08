import { useState } from "react"
import {
  Button,
  Modal,
  PageTitle,
  Table,
  Textarea,
} from "../../../components/ui/Primitives"

export default function ApprovalQueuePage() {
  const [detail, setDetail] = useState(null)
  const [reason, setReason] = useState("")
  const rows = Array.from({ length: 6 }, (_, i) => ({
    id: i,
    type: i % 2 ? "Trường thông tin" : "Phiên bản biểu mẫu",
    code: i % 2 ? `field_code_${i}` : `DRL-2026-v${i}`,
    name: i % 2 ? "Điểm tham gia hoạt động" : "Phiếu ĐRL 2026",
    request: ["Tạo mới", "Sửa", "Vô hiệu hóa"][i % 3],
    owner: i < 2 ? "Lê Thu Hà" : "Nguyễn Hải Nam",
    date: `${10 + i}/10/2026`,
    own: i < 2,
  }))
  return (
    <>
      <PageTitle
        title="Danh sách chờ xử lý"
        description="Duyệt yêu cầu cấu hình theo nguyên tắc Maker – Checker."
      />
      <div className="mb-4 flex gap-1 border-b border-line">
        <button className="px-4 py-3 text-muted">Đang xử lý</button>
        <button className="border-b-2 border-brand px-4 py-3 font-medium text-brand">
          Chờ tôi duyệt (6)
        </button>
      </div>
      <Table
        rows={rows}
        onRow={setDetail}
        columns={[
          { key: "stt", title: "STT", render: (_, i) => i + 1 },
          { key: "type", title: "Loại đối tượng" },
          { key: "code", title: "Mã", render: (r) => <code>{r.code}</code> },
          { key: "name", title: "Tên" },
          { key: "request", title: "Loại yêu cầu" },
          { key: "owner", title: "Người yêu cầu" },
          { key: "date", title: "Ngày gửi" },
          {
            key: "action",
            title: "Thao tác",
            render: (r) => (
              <Button
                disabled={r.own}
                title={r.own ? "Không thể tự duyệt bản ghi của chính mình" : ""}
                onClick={() => setDetail(r)}
              >
                Xem
              </Button>
            ),
          },
        ]}
      />
      <Modal
        open={!!detail}
        title="Chi tiết yêu cầu"
        onClose={() => setDetail(null)}
        footer={
          <>
            <Button
              variant="danger"
              disabled={detail?.own}
              onClick={() => setDetail(null)}
            >
              Từ chối
            </Button>
            <Button
              variant="primary"
              disabled={detail?.own}
              onClick={() => setDetail(null)}
            >
              Phê duyệt
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 rounded-lg bg-canvas p-4 text-sm">
            <span className="text-muted">Mã</span>
            <code>{detail?.code}</code>
            <span className="text-muted">Người yêu cầu</span>
            <b>{detail?.owner}</b>
          </div>
          {detail?.own && (
            <div className="rounded-lg border border-brand-line bg-brand-soft p-3 text-sm">
              Bạn không thể tự duyệt bản ghi do chính mình tạo.
            </div>
          )}
          <Textarea
            label="Ghi chú xử lý"
            value={reason}
            maxLength={1000}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
      </Modal>
    </>
  )
}
