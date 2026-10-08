import { Download, Eye } from "lucide-react"
import { useState } from "react"
import PdfViewer from "../../components/ui/PdfViewer"
import StatusTag from "../../components/ui/StatusTag"
import {
  IconButton,
  Modal,
  PageTitle,
  Table,
} from "../../components/ui/Primitives"

export default function HistoryPage() {
  const [pdf, setPdf] = useState(false)
  const rows = [
    {
      id: 1,
      semester: "HK2, 2025-2026",
      score: 86,
      rank: "Tốt",
      status: "Hoàn tất",
      date: "30/05/2026",
    },
    {
      id: 2,
      semester: "HK1, 2025-2026",
      score: 78,
      rank: "Khá",
      status: "Hoàn tất",
      date: "15/12/2025",
    },
  ]
  return (
    <>
      <PageTitle
        title="Lịch sử phiếu"
        description="Các phiếu điểm rèn luyện đã hoàn thành theo học kỳ."
      />
      <Table
        rows={rows}
        columns={[
          { key: "stt", title: "STT", render: (_, i) => i + 1 },
          { key: "semester", title: "Học kỳ" },
          { key: "score", title: "Tổng điểm" },
          { key: "rank", title: "Xếp loại" },
          {
            key: "status",
            title: "Trạng thái",
            render: (r) => <StatusTag status={r.status} />,
          },
          { key: "date", title: "Ngày hoàn tất" },
          {
            key: "action",
            title: "Thao tác",
            render: () => (
              <div className="flex">
                <IconButton label="Xem PDF" onClick={() => setPdf(true)}>
                  <Eye className="size-4" />
                </IconButton>
                <IconButton label="Tải PDF">
                  <Download className="size-4" />
                </IconButton>
              </div>
            ),
          },
        ]}
      />
      <Modal
        open={pdf}
        title="Phiếu điểm rèn luyện"
        wide
        onClose={() => setPdf(false)}
      >
        <PdfViewer official score={86} />
      </Modal>
    </>
  )
}
