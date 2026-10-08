import { useState } from "react"
import { Check, Signature } from "lucide-react"
import { Button, Input, Modal } from "../ui/Primitives"

export default function SignConfirmModal({
  open,
  level = 1,
  summary,
  onClose,
  onConfirm,
}) {
  const [checked, setChecked] = useState(false)
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const titles = ["", "Ký và gửi duyệt", "Ký và duyệt phiếu", "Ký duyệt lô"]
  const labels = ["", "Sinh viên", "Lớp trưởng", "Trưởng khoa"]
  const submit = async () => {
    if (!checked) return setError("Vui lòng xác nhận đã xem xét nội dung")
    if (password !== "123456") return setError("Mật khẩu không đúng")
    setError("")
    setLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 900))
    setLoading(false)
    onConfirm?.()
  }
  return (
    <Modal
      open={open}
      title={titles[level]}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Hủy</Button>
          <Button variant="primary" loading={loading} onClick={submit}>
            {titles[level]}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="rounded-lg bg-canvas p-4">
          <div className="text-xs font-medium text-muted">Tóm tắt</div>
          <div className="mt-1 font-semibold">{summary}</div>
        </div>
        <div className="flex h-28 items-center justify-center rounded-lg border border-line bg-white">
          <div className="text-center">
            <Signature className="mx-auto size-5 text-muted" />
            <div className="signature-stroke mt-1 text-2xl text-night">
              {level === 1 ? "Văn An" : level === 2 ? "Minh Đức" : "Quốc Bảo"}
            </div>
            <div className="mt-1 text-xs text-muted">Ô ký {labels[level]}</div>
          </div>
        </div>
        {level === 3 && (
          <div className="rounded-lg border border-brand-line bg-brand-soft p-3 text-sm">
            Sau khi ký, phiếu được khóa chứng nhận (DocMDP) và không thể chỉnh
            sửa.
          </div>
        )}
        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-line p-3">
          <input
            type="checkbox"
            checked={checked}
            onChange={(event) => setChecked(event.target.checked)}
            className="mt-1 accent-brand"
          />
          <span>
            <span className="font-medium">
              Tôi xác nhận đã xem xét nội dung
            </span>
            <span className="block text-xs text-muted">
              Hành động ký được ghi nhận vào lịch sử xử lý.
            </span>
          </span>
        </label>
        <Input
          label="Nhập lại mật khẩu"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Mật khẩu demo: 123456"
          error={error}
        />
      </div>
    </Modal>
  )
}
