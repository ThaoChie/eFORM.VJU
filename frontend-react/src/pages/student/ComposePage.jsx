import { ArrowLeft, MoreHorizontal, Paperclip, Save, Send } from "lucide-react"
import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { criteriaGroups } from "../../services/submission-service"
import { rankScore } from "../../common/constants"
import { useSubmissionStore } from "../../stores/useSubmissionStore"
import SignConfirmModal from "../../components/signature/SignConfirmModal"
import SplitScreen from "../../components/split-screen/SplitScreen"
import PdfViewer from "../../components/ui/PdfViewer"
import { Button, Card, Input, Modal } from "../../components/ui/Primitives"

export default function ComposePage() {
  const navigate = useNavigate()
  const { scores, setScore, save, submit, hasSignature } = useSubmissionStore()
  const [sign, setSign] = useState(false)
  const [missing, setMissing] = useState(false)
  const [saved, setSaved] = useState("")
  const total = useMemo(
    () =>
      Object.values(scores).reduce((sum, value) => sum + Number(value || 0), 0),
    [scores],
  )
  const doSave = async () => {
    await save()
    setSaved(
      `Đã lưu lúc ${new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`,
    )
  }
  const send = () => (hasSignature ? setSign(true) : setMissing(true))
  const left = (
    <Card className="p-0">
      <div className="border-b border-line p-5">
        <h2 className="font-semibold">Thông tin sinh viên</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-xs text-muted">Họ tên</span>
            <p>Nguyễn Văn An</p>
          </div>
          <div>
            <span className="text-xs text-muted">Mã sinh viên</span>
            <p>23110101</p>
          </div>
          <div>
            <span className="text-xs text-muted">Lớp</span>
            <p>BCSE2023</p>
          </div>
          <div>
            <span className="text-xs text-muted">Khoa</span>
            <p>Công nghệ thông tin</p>
          </div>
        </div>
      </div>
      <div className="max-h-[660px] overflow-y-auto pb-24">
        {criteriaGroups.map((group) => (
          <details key={group.title} open className="border-b border-line">
            <summary className="cursor-pointer bg-canvas px-5 py-4 font-semibold">
              {group.title}
              <span className="float-right text-xs font-normal text-muted">
                {group.items.reduce(
                  (s, [code]) => s + Number(scores[code] || 0),
                  0,
                )}{" "}
                / {group.max}
              </span>
            </summary>
            <div>
              {group.items.map(([code, label, max]) => (
                <div
                  key={code}
                  className="grid gap-3 border-t border-line p-4 first:border-0 sm:grid-cols-[1fr_90px]"
                >
                  <div>
                    <p className="font-medium">{label}</p>
                    <p className="mt-1 text-xs text-muted">
                      Tối đa: {max} ·{" "}
                      {code.includes("proof") || code.includes("activity")
                        ? "Cần minh chứng"
                        : "Minh chứng không bắt buộc"}
                    </p>
                    <button className="mt-2 inline-flex items-center gap-1 text-xs text-muted hover:text-brand">
                      <Paperclip className="size-3.5" />
                      Thêm minh chứng
                    </button>
                  </div>
                  <Input
                    type="number"
                    min="0"
                    max={max}
                    value={scores[code] ?? ""}
                    onChange={(event) =>
                      setScore(code, Math.min(max, Number(event.target.value)))
                    }
                    error={
                      Number(scores[code]) > max
                        ? `Điểm không được vượt quá ${max}`
                        : ""
                    }
                  />
                </div>
              ))}
            </div>
          </details>
        ))}
      </div>
      <div className="sticky bottom-0 flex items-center justify-between border-t border-line bg-white p-4">
        <div>
          <span className="text-xs text-muted">Tổng điểm tự chấm</span>
          <p className="text-xl font-semibold">{total} / 100</p>
        </div>
        <span className="rounded-full bg-canvas px-3 py-1.5 text-xs font-medium">
          Xếp loại: {rankScore(total)}
        </span>
      </div>
    </Card>
  )
  return (
    <>
      <div className="sticky top-14 z-10 -mx-4 mb-4 flex flex-wrap items-center gap-2 border-y border-line bg-white px-4 py-3 md:-mx-6 md:px-6">
        <Button onClick={() => navigate(-1)}>
          <ArrowLeft className="size-4" />
          Quay lại
        </Button>
        <span className="ml-auto text-xs text-muted">
          {saved || "Thay đổi chưa lưu"}
        </span>
        <Button onClick={doSave}>
          <Save className="size-4" />
          Lưu nháp
        </Button>
        <Button variant="primary" onClick={send}>
          <Send className="size-4" />
          Đẩy duyệt
        </Button>
      </div>
      <SplitScreen left={left} right={<PdfViewer score={total} />} />
      <Modal
        open={missing}
        title="Bạn chưa có chữ ký"
        onClose={() => setMissing(false)}
        footer={
          <>
            <Button onClick={() => setMissing(false)}>Ở lại</Button>
            <Button
              variant="primary"
              onClick={() => navigate("/student/signature")}
            >
              Đi tới Chữ ký của tôi
            </Button>
          </>
        }
      >
        <p>Bạn chưa có chữ ký. Hãy tải ảnh chữ ký trước khi ký.</p>
      </Modal>
      <SignConfirmModal
        open={sign}
        level={1}
        summary={`Tổng điểm tự chấm: ${total}/100 · 3 minh chứng`}
        onClose={() => setSign(false)}
        onConfirm={() => {
          submit()
          setSign(false)
          navigate("/student/pending")
        }}
      />
    </>
  )
}
