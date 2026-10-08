import { ArrowLeft, CheckSquare } from "lucide-react"
import { useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import BatchSignProgress from "../../components/signature/BatchSignProgress"
import SignConfirmModal from "../../components/signature/SignConfirmModal"
import PdfViewer from "../../components/ui/PdfViewer"
import { Button, Card, Modal } from "../../components/ui/Primitives"

export default function BatchDetailPage() {
  const navigate = useNavigate()
  const { classId } = useParams()
  const [selected, setSelected] = useState(
    Array.from({ length: 12 }, (_, i) => i),
  )
  const [sign, setSign] = useState(false)
  const [progress, setProgress] = useState(false)
  const names = [
    "Trần Minh Anh",
    "Lê Hoàng Nam",
    "Ngô Thùy Dương",
    "Đỗ Gia Bảo",
    "Phan Hải Yến",
    "Trương Quốc Việt",
    "Bùi Khánh Linh",
    "Hoàng Đức Long",
    "Đặng Thu Trang",
    "Võ Minh Quân",
    "Lý Bảo Ngọc",
    "Hà Nhật Minh",
  ]
  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Button onClick={() => navigate(-1)}>
          <ArrowLeft className="size-4" />
          Quay lại
        </Button>
        <div className="ml-2">
          <h1 className="text-lg font-semibold">Lô lớp {classId}</h1>
          <p className="text-xs text-muted">42 phiếu chờ khoa ký</p>
        </div>
        <Button variant="danger" className="ml-auto">
          Trả lại
        </Button>
        <Button variant="primary" onClick={() => setSign(true)}>
          Ký duyệt lô ({selected.length})
        </Button>
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.05fr_.95fr]">
        <Card className="p-0">
          <div className="flex items-center justify-between border-b border-line p-4">
            <b>Danh sách phiếu</b>
            <label className="text-xs">
              <input
                type="checkbox"
                checked={selected.length === 12}
                onChange={(e) =>
                  setSelected(
                    e.target.checked
                      ? Array.from({ length: 12 }, (_, i) => i)
                      : [],
                  )
                }
                className="mr-2 accent-brand"
              />
              Chọn tất cả
            </label>
          </div>
          <div className="max-h-[650px] overflow-auto">
            {names.map((name, i) => (
              <label
                key={name}
                className="grid cursor-pointer grid-cols-[24px_1fr_70px_60px] items-center border-b border-line p-3 hover:bg-canvas"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(i)}
                  onChange={() =>
                    setSelected(
                      selected.includes(i)
                        ? selected.filter((x) => x !== i)
                        : [...selected, i],
                    )
                  }
                  className="accent-brand"
                />
                <span>
                  <b className="text-sm">{name}</b>
                  <small className="block text-muted">23110{120 + i}</small>
                </span>
                <span>{78 + (i % 10)} điểm</span>
                <span className="text-xs text-muted">
                  {i % 3 === 0 ? "Chênh lệch" : "Khớp"}
                </span>
              </label>
            ))}
          </div>
        </Card>
        <div>
          <div className="mb-3 flex gap-1 overflow-x-auto border-b border-line">
            <button className="whitespace-nowrap border-b-2 border-brand px-3 py-2 text-brand">
              Chấm điểm
            </button>
            <button className="px-3 py-2 text-muted">Minh chứng</button>
            <button className="whitespace-nowrap px-3 py-2 text-muted">
              Nhận xét lớp
            </button>
            <button className="whitespace-nowrap px-3 py-2 text-muted">
              Bản xem trước PDF
            </button>
          </div>
          <PdfViewer score={82} />
        </div>
      </div>
      <SignConfirmModal
        open={sign}
        level={3}
        summary={`${selected.length} phiếu · 1 lớp · 4 phiếu có chênh lệch`}
        onClose={() => setSign(false)}
        onConfirm={() => {
          setSign(false)
          setProgress(true)
        }}
      />
      <Modal open={progress} title="Tiến trình ký lô" wide onClose={() => {}}>
        <BatchSignProgress
          count={selected.length}
          onClose={() => {
            setProgress(false)
            navigate("/dean/batches")
          }}
        />
      </Modal>
    </>
  )
}
