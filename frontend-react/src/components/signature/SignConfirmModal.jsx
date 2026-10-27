import { useState, useRef, useEffect, useMemo } from "react"
import { Check, Signature, ShieldCheck, FileText, Award, Calendar, Paperclip, User, Upload } from "lucide-react"
import { Button, Input, Modal } from "../ui/Primitives"
import { normalizeSignatureImage, generateSignatureSvg } from "../ui/PdfViewer"

export default function SignConfirmModal({
  open,
  level = 1,
  summary,
  summaryData = null,
  signatureImage = null,
  userName = "",
  onClose,
  onConfirm,
  onNavigateToSignature = null,
}) {
  const [checked, setChecked] = useState(false)
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef(null)
  const [currentSig, setCurrentSig] = useState(signatureImage)

  useEffect(() => {
    setCurrentSig(signatureImage)
  }, [signatureImage])

  const titles = ["", "Ký và gửi duyệt", "Ký và duyệt phiếu", "Ký duyệt lô"]
  const labels = ["", "Sinh viên", "Lớp trưởng", "Trưởng khoa"]
  const displayName = userName || (level === 1 ? "Sinh viên" : level === 2 ? "Lớp trưởng" : "Trưởng khoa")

  const renderedSig = useMemo(() => {
    if (currentSig) {
      return normalizeSignatureImage(currentSig, displayName)
    }
    return generateSignatureSvg(displayName)
  }, [currentSig, displayName])

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const res = reader.result
      setCurrentSig(res)
      try {
        if (level === 2) {
          localStorage.setItem("user_signature_3", res)
        } else if (level === 3) {
          localStorage.setItem("user_signature_2", res)
        }
      } catch (err) {
        console.warn("Storage warning:", err)
      }
    }
    reader.readAsDataURL(file)
  }

  const submit = async () => {
    if (!checked) return setError("Vui lòng xác nhận đã xem xét nội dung")
    if (password && password !== "123456") return setError("Mật khẩu không đúng")
    setError("")
    setLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 400))
    setLoading(false)
    onConfirm?.(renderedSig || currentSig || signatureImage)
  }

  return (
    <Modal
      open={open}
      title={titles[level]}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Hủy</Button>
          <Button variant="primary" loading={loading} onClick={submit}>
            {titles[level]}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* VÙNG TÓM TẮT THÔNG TIN PHIẾU ĐRL */}
        {summaryData ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
              <div className="flex items-center gap-2">
                <div className="size-7 rounded-full bg-brand-soft text-brand flex items-center justify-center font-bold text-xs">
                  <User className="size-3.5" />
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block leading-tight">
                    Người nộp phiếu
                  </span>
                  <p className="font-bold text-slate-800 text-xs">
                    {summaryData.studentName || displayName}
                  </p>
                </div>
              </div>
              {(summaryData.studentCode || summaryData.studentClass) && (
                <div className="text-right text-[11px] text-slate-600 font-mono">
                  <span className="font-semibold text-slate-700">{summaryData.studentCode}</span>
                  {summaryData.studentClass && <span className="text-slate-400 ml-1.5">({summaryData.studentClass})</span>}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-lg bg-white p-2.5 border border-slate-200/80">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Học kỳ</span>
                <span className="font-semibold text-slate-800 truncate block mt-0.5">
                  {summaryData.semesterName || "Học kỳ đánh giá"}
                </span>
              </div>
              <div className="rounded-lg bg-white p-2.5 border border-slate-200/80">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Minh chứng</span>
                <span className="font-bold text-slate-800 font-mono block mt-0.5">
                  {summaryData.proofCount || 0} file đính kèm
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-white border border-brand/20 p-3 shadow-2xs">
              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                  Tổng điểm tự chấm
                </span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-2xl font-black font-mono text-brand">
                    {summaryData.totalScore ?? 0}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">/ 100 điểm</span>
                </div>
              </div>
              {summaryData.rank && (
                <div className="text-right">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">
                    Xếp loại gợi ý
                  </span>
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border ${summaryData.rankColor || "bg-emerald-50 text-emerald-700 border-emerald-200"}`}>
                    {summaryData.rank}
                  </span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-xs text-slate-700">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">Tóm tắt</span>
            <p className="font-semibold text-slate-800">{summary}</p>
          </div>
        )}

        {/* VÙNG HIỂN THỊ CHỮ KÝ ĐIỆN TỬ */}
        <input
          type="file"
          ref={fileInputRef}
          accept="image/png,image/jpeg,image/jpg,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />

        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-3.5 min-h-[130px]">
          {currentSig ? (
            <div className="text-center w-full">
              <div className="flex items-center justify-center p-2 bg-slate-50/60 rounded-lg w-full min-h-[80px]">
                <img
                  src={renderedSig}
                  alt={`Chữ ký ${displayName}`}
                  className="max-h-20 max-w-[260px] object-contain drop-shadow-xs"
                  style={{ mixBlendMode: "multiply" }}
                  onError={(e) => {
                    e.currentTarget.onerror = null
                    e.currentTarget.src = generateSignatureSvg(displayName)
                  }}
                />
              </div>
              <div className="mt-2 flex items-center justify-center gap-1.5 text-xs text-slate-600 font-medium">
                <ShieldCheck className="size-3.5 text-emerald-600 shrink-0" />
                <span>Chữ ký số đã xác thực · {displayName} ({labels[level]})</span>
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-1.5 text-xs font-semibold text-brand hover:underline inline-flex items-center gap-1"
              >
                <Upload className="size-3" />
                <span>Chọn ảnh chữ ký khác từ máy tính</span>
              </button>
            </div>
          ) : (
            <div className="text-center py-2">
              <Signature className="mx-auto size-6 text-slate-400 mb-1" />
              <div className="signature-stroke text-2xl text-slate-800">
                {displayName}
              </div>
              <div className="mt-1 text-xs text-slate-400">Ô ký {labels[level]}</div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-2 text-xs font-semibold text-brand hover:underline inline-flex items-center gap-1"
              >
                <Upload className="size-3" />
                <span>Tải ảnh chữ ký từ máy tính</span>
              </button>
            </div>
          )}
        </div>

        {level === 3 && (
          <div className="rounded-lg border border-brand-line bg-brand-soft p-3 text-xs text-brand-dark">
            Sau khi ký, phiếu được khóa chứng nhận (DocMDP) và không thể chỉnh sửa.
          </div>
        )}

        {/* XÁC NHẬN NỘI DUNG */}
        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 bg-white p-3 hover:bg-slate-50/50 transition">
          <input
            type="checkbox"
            checked={checked}
            onChange={(event) => setChecked(event.target.checked)}
            className="mt-0.5 accent-brand"
          />
          <span className="text-xs">
            <span className="font-semibold text-slate-800 block">
              Tôi xác nhận đã xem xét kỹ toàn bộ điểm tự chấm và minh chứng
            </span>
            <span className="text-slate-500 mt-0.5 block leading-relaxed">
              Hành động ký điện tử sẽ được ghi nhận vào lịch sử xử lý (audit trail) kèm địa chỉ IP.
            </span>
          </span>
        </label>

        {/* NHẬP MẬT KHẨU XÁC THỰC */}
        <Input
          label="Nhập lại mật khẩu để xác thực chữ ký"
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

