import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react"
import { useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { criteriaGroups } from "../../services/submission-service"
import { rankScore } from "../../common/constants/index.js"
import { useReviewStore } from "../../stores/useReviewStore"
import SignConfirmModal from "../../components/signature/SignConfirmModal"
import PdfViewer from "../../components/ui/PdfViewer"
import {
  Button,
  Card,
  IconButton,
  Input,
  Modal,
  Textarea,
} from "../../components/ui/Primitives"

export default function ReviewDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { items, approve } = useReviewStore()
  const item = items.find((x) => x.id === id) ?? {
    id,
    name: "Trần Minh Anh",
    code: "23110120",
    score: 82,
  }
  const flat = criteriaGroups.flatMap((g) => g.items)
  const initial = Object.fromEntries(
    flat.map(([code, , max], i) => [
      code,
      Math.min(max, Math.round(item.score / flat.length) + (i % 2)),
    ]),
  )
  const [scores, setScores] = useState(initial)
  const [comment, setComment] = useState("")
  const [error, setError] = useState("")
  const [sign, setSign] = useState(false)
  const [reason, setReason] = useState(false)
  const [conflict, setConflict] = useState(false)
  const total = useMemo(
    () => Object.values(scores).reduce((s, v) => s + Number(v || 0), 0),
    [scores],
  )
  const changed = Object.values(scores).filter(
    (v, i) => v !== Object.values(initial)[i],
  ).length
  const confirm = () => {
    if (comment.length < 10) {
      setError("Vui lòng nhập nhận xét đánh giá trước khi ký")
      return
    }
    setSign(true)
  }
  const done = () => {
    setSign(false)
    if (item.conflict) return setConflict(true)
    approve(id)
    navigate("/class-leader/review")
  }
  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Button onClick={() => navigate(-1)}>
          <ArrowLeft className="size-4" />
          Quay lại
        </Button>
        <div>
          <h1 className="text-lg font-semibold">{item.name}</h1>
          <p className="text-xs text-muted">
            {item.code} · BCSE2023 · HK1, 2026-2027
          </p>
        </div>
        <div className="ml-auto flex">
          <IconButton label="Phiếu trước">
            <ChevronLeft className="size-5" />
          </IconButton>
          <IconButton label="Phiếu sau">
            <ChevronRight className="size-5" />
          </IconButton>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.15fr_.85fr]">
        <Card className="p-0">
          <div className="grid grid-cols-[1fr_70px_80px] gap-2 bg-canvas p-3 text-xs font-semibold">
            <span>Tiêu chí</span>
            <span>SV chấm</span>
            <span>Lớp chấm</span>
          </div>
          <div className="max-h-[590px] overflow-auto">
            {flat.map(([code, label, max], i) => (
              <div
                key={code}
                className={`grid grid-cols-[1fr_70px_80px] items-center gap-2 border-t border-line p-3 ${
                  scores[code] !== initial[code] ? "bg-brand-soft" : ""
                }`}
              >
                <span className="text-sm">
                  {scores[code] !== initial[code] && (
                    <b className="mr-2 text-brand">●</b>
                  )}
                  {label}
                  <small className="block text-muted">Tối đa {max}</small>
                </span>
                <span>{initial[code]}</span>
                <Input
                  type="number"
                  min="0"
                  max={max}
                  value={scores[code]}
                  onChange={(e) =>
                    setScores({
                      ...scores,
                      [code]: Math.min(max, Number(e.target.value)),
                    })
                  }
                />
              </div>
            ))}
          </div>
        </Card>
        <div>
          <div className="mb-3 flex gap-1 border-b border-line">
            <button className="border-b-2 border-brand px-3 py-2 text-brand">
              Minh chứng
            </button>
            <button className="px-3 py-2 text-muted">Bản xem trước PDF</button>
          </div>
          <PdfViewer score={total} />
        </div>
      </div>
      <div className="sticky bottom-0 z-10 mt-4 rounded-lg border border-line bg-white p-4">
        <div className="mb-3 flex flex-wrap gap-5 text-sm">
          <span>
            Tổng điểm SV: <b>{item.score}</b>
          </span>
          <span>
            Tổng điểm Lớp: <b>{total}</b>
          </span>
          <span>
            Xếp loại: <b>{rankScore(total)}</b>
          </span>
        </div>
        <Textarea
          label="Nhận xét đánh giá cấp lớp"
          value={comment}
          maxLength={1000}
          onChange={(e) => setComment(e.target.value)}
          error={error}
        />
        <div className="mt-3 flex justify-end gap-2">
          <Button variant="danger" onClick={() => setReason(true)}>
            Trả lại
          </Button>
          <Button>Lưu nháp chấm</Button>
          <Button variant="primary" onClick={confirm}>
            Ký và duyệt
          </Button>
        </div>
      </div>
      <SignConfirmModal
        open={sign}
        level={2}
        summary={`Tổng SV: ${item.score} · Tổng Lớp: ${total} · ${changed} tiêu chí đã sửa`}
        onClose={() => setSign(false)}
        onConfirm={done}
      />
      <Modal
        open={reason}
        title="Trả lại phiếu"
        onClose={() => setReason(false)}
        footer={
          <>
            <Button onClick={() => setReason(false)}>Hủy</Button>
            <Button
              variant="danger"
              onClick={() => navigate("/class-leader/review")}
            >
              Xác nhận trả lại
            </Button>
          </>
        }
      >
        <Textarea
          label="Lý do trả"
          value={comment}
          maxLength={1000}
          onChange={(e) => setComment(e.target.value)}
        />
      </Modal>
      <Modal
        open={conflict}
        title="Phiếu đã được xử lý"
        onClose={() => setConflict(false)}
        footer={
          <Button
            variant="primary"
            onClick={() => navigate("/class-leader/review")}
          >
            Về danh sách
          </Button>
        }
      >
        <p>Phiếu đã được xử lý bởi Vũ Thanh Hằng.</p>
      </Modal>
    </>
  )
}
