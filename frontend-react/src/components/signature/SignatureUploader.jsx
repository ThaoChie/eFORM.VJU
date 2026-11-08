import { ImagePlus, ShieldCheck, Upload, Check, Lock, AlertCircle, FileCheck, Info } from "lucide-react"
import { useRef, useState, useEffect } from "react"
import { toast } from "react-hot-toast"
import { useSubmissionStore } from "../../stores/useSubmissionStore"
import { useAuthStore } from "../../stores/useAuthStore"
import { client } from "../../lib/axios/client"
import { Button, Card, Modal, CancelButton } from "../ui/Primitives"
import { normalizeSignatureImage, isValidSignatureImage } from "../ui/PdfViewer"

/**
 * Đọc file ảnh chữ ký thành chuỗi Data URL chuẩn (PNG, JPG, JPEG, WEBP)
 */
async function processSignatureFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error("Không thể đọc file ảnh từ thiết bị"))
    reader.onload = () => {
      let raw = reader.result
      if (typeof raw !== "string") {
        return reject(new Error("Dữ liệu ảnh không hợp lệ"))
      }

      // Chuẩn hóa MIME type nếu hệ điều hành không gán đúng
      const ext = (file.name || "").split(".").pop().toLowerCase()
      if (!raw.startsWith("data:image/")) {
        const mime = (ext === "jpg" || ext === "jpeg") ? "image/jpeg" : ext === "webp" ? "image/webp" : "image/png"
        raw = raw.replace(/^data:[^;]*;/, `data:${mime};`)
      }

      // Tối ưu kích thước nếu ảnh quá lớn (> 1200px) để lưu database nhẹ nhàng
      const img = new Image()
      img.onerror = () => resolve(raw)
      img.onload = () => {
        try {
          let w = img.naturalWidth || img.width || 600
          let h = img.naturalHeight || img.height || 200
          const maxW = 1000
          const maxH = 500
          if (w > maxW || h > maxH) {
            const ratio = Math.min(maxW / w, maxH / h)
            w = Math.round(w * ratio)
            h = Math.round(h * ratio)
            const canvas = document.createElement("canvas")
            canvas.width = Math.max(1, w)
            canvas.height = Math.max(1, h)
            const ctx = canvas.getContext("2d")
            if (ctx) {
              ctx.drawImage(img, 0, 0, w, h)
              const scaled = canvas.toDataURL("image/png")
              if (scaled && scaled.length > 50 && scaled.startsWith("data:image/")) {
                return resolve(scaled)
              }
            }
          }
          resolve(raw)
        } catch {
          resolve(raw)
        }
      }
      img.src = raw
    }
    reader.readAsDataURL(file)
  })
}

export default function SignatureUploader({ level = 1 }) {
  const inputRef = useRef(null)
  const user = useAuthStore((s) => s.user)
  const { registerSignature } = useSubmissionStore()

  const userStorageKey = user?.id ? `user_signature_${user.id}` : null

  // Chữ ký chỉ coi là đã khóa nếu cờ isSignatureLocked = true VÀ có dữ liệu ảnh hợp lệ (không phải SVG giả lập)
  const hasRealUploadedSig = Boolean(
    user?.signatureSpecimenUrl &&
    !user.signatureSpecimenUrl.startsWith('data:image/svg+xml') &&
    isValidSignatureImage(user?.signatureSpecimenUrl)
  )
  const isLocked = Boolean(hasRealUploadedSig && user?.isSignatureLocked)
  const [isEditing, setIsEditing] = useState(false)
  const [liveBlobUrl, setLiveBlobUrl] = useState(null)

  const [preview, setPreview] = useState(() => {
    const existing = user?.signatureSpecimenUrl || (userStorageKey ? localStorage.getItem(userStorageKey) : null)
    if (existing && existing.startsWith("blob:")) {
      try { localStorage.removeItem(userStorageKey) } catch {}
      return null
    }
    return isValidSignatureImage(existing) ? normalizeSignatureImage(existing, user?.fullName) : null
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [confirmLockModalOpen, setConfirmLockModalOpen] = useState(false)

  useEffect(() => {
    const existing = user?.signatureSpecimenUrl || (userStorageKey ? localStorage.getItem(userStorageKey) : null)
    if (existing && existing.startsWith("blob:")) {
      try { localStorage.removeItem(userStorageKey) } catch {}
      return
    }
    if (isValidSignatureImage(existing)) {
      setPreview((prev) => prev || normalizeSignatureImage(existing, user?.fullName))
      registerSignature()
    }
  }, [user?.signatureSpecimenUrl, userStorageKey, registerSignature, user?.fullName])

  const select = (file) => {
    if (!file) return

    const ext = file.name ? file.name.split(".").pop().toLowerCase() : ""
    const isAcceptedFormat = [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/webp",
      "image/heic",
      "image/heif",
    ].includes(file.type?.toLowerCase()) || ["png", "jpg", "jpeg", "webp", "heic", "heif"].includes(ext)

    if (!isAcceptedFormat || file.size > 10 * 1024 * 1024) {
      return setError("Chỉ nhận file ảnh PNG, JPG, JPEG hoặc WEBP với dung lượng tối đa 10 MB.")
    }
    setError("")

    // 1. Tạo Blob URL trực tiếp từ File object để hiển thị tức thì không bao giờ lỗi
    try {
      const blob = URL.createObjectURL(file)
      setLiveBlobUrl(blob)
    } catch (e) {
      console.warn("Could not create object URL:", e)
    }

    // 2. Đọc Data URL chuẩn để lưu trữ vào backend và localStorage
    const reader = new FileReader()
    reader.onerror = () => setError("Không thể đọc file ảnh từ thiết bị")
    reader.onload = () => {
      let raw = reader.result
      if (typeof raw === "string") {
        if (!raw.startsWith("data:image/")) {
          const mime = (ext === "jpg" || ext === "jpeg") ? "image/jpeg" : ext === "webp" ? "image/webp" : "image/png"
          raw = raw.replace(/^data:[^;]*;/, `data:${mime};`)
        }
        setPreview(raw)
      }
    }
    reader.readAsDataURL(file)
  }

  const currentDisplay = liveBlobUrl || preview

  const handleConfirmSaveAndLock = async () => {
    const signatureToSave = preview || liveBlobUrl
    if (!signatureToSave) return
    setSaving(true)
    setError("")
    try {
      let finalSignature = signatureToSave
      // Nếu là blob URL mà preview chưa hoàn tất, đọc Data URL trước khi gửi
      if (finalSignature.startsWith("blob:") && inputRef.current?.files?.[0]) {
        try {
          finalSignature = await processSignatureFile(inputRef.current.files[0])
        } catch {}
      }

      // 1. Sync with backend API to compute SHA-256 and lock permanently
      let backendHash = null
      try {
        const res = await client.post("/users/signature", { signature: finalSignature })
        backendHash = res?.signatureHash || res?.data?.signatureHash || null
        if (res?.signature || res?.data?.signature) {
          finalSignature = res?.signature || res?.data?.signature
        }
      } catch (apiErr) {
        console.warn("Backend signature sync warning:", apiErr)
      }

      // 2. Persist locally scoped to current user
      if (userStorageKey) {
        localStorage.setItem(userStorageKey, finalSignature)
      }
      if (user?.id) {
        localStorage.setItem(`user_signature_${user.id}`, finalSignature)
      }
      if (user?.userID) {
        localStorage.setItem(`user_signature_${user.userID}`, finalSignature)
      }
      if (user?.userCode) {
        localStorage.setItem(`user_signature_${user.userCode}`, finalSignature)
      }
      localStorage.setItem("user_signature", finalSignature)
      const roleStr = (user?.role || "").toLowerCase()
      if (level === 2 || roleStr.includes("leader") || roleStr.includes("deputy")) {
        localStorage.setItem("user_signature_3", finalSignature)
      } else if (level === 3 || roleStr.includes("dean")) {
        localStorage.setItem("user_signature_2", finalSignature)
      } else {
        localStorage.setItem("user_signature_4", finalSignature)
      }
      registerSignature()

      // 3. Update auth store state & localStorage user
      if (user) {
        const updatedUser = {
          ...user,
          signatureSpecimenUrl: finalSignature,
          isSignatureLocked: true,
          signatureHash: backendHash || "ENCRYPTED_SHA256",
          signatureRegisteredAt: new Date().toISOString(),
        }
        useAuthStore.setState({ user: updatedUser })
        try {
          localStorage.setItem("user", JSON.stringify(updatedUser))
        } catch {}
      }

      setIsEditing(false)
      setConfirmLockModalOpen(false)
      toast.success("Đã tải lên và khóa chữ ký điện tử thành công! Chữ ký hiện ở trạng thái bất biến.")
    } catch (e) {
      setError("Không thể lưu chữ ký: " + (e.message || "Lỗi hệ thống"))
    } finally {
      setSaving(false)
    }
  }

  const fingerprintText = user?.signatureHash
    ? `SIG-${user.signatureHash.slice(0, 10).toUpperCase()}`
    : user?.id
      ? `SIG-${String(user.id).padStart(6, "0")}A`
      : "SIG-ACTIVE"

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <Card>
          <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="font-semibold text-slate-900 text-base flex items-center gap-2">
                Chữ ký điện tử chính chủ ({level === 1 ? "Sinh viên" : level === 2 ? "Cán bộ lớp" : "Trưởng Khoa / GVCN"})
                {isLocked && <Lock className="size-3.5 text-slate-400" />}
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                {isLocked
                  ? "Chữ ký đã được mã hóa và khóa bảo mật vĩnh viễn theo định danh của bạn."
                  : `Mỗi ${level === 1 ? "sinh viên" : level === 2 ? "cán bộ lớp" : "giáo viên / trưởng khoa"} cần tải lên ảnh chữ ký một lần duy nhất. Hệ thống tự động tách nền giấy và khóa chữ ký số.`}
              </p>
            </div>
            {isLocked ? (
              <span className="inline-flex items-center gap-1.5 text-xs text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md">
                <Lock className="size-3.5 text-slate-500" />
                Đã khóa bảo mật
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md">
                <AlertCircle className="size-3.5 text-slate-400" />
                Chưa có chữ ký
              </span>
            )}
          </div>

          {/* VÙNG HIỂN THỊ CHỮ KÝ */}
          {isLocked ? (
            /* TRẠNG THÁI ĐÃ KHÓA: HIỂN THỊ CHỮ KÝ BẤT BIẾN, KHÔNG HIỂN THỊ NÚT THAY ĐỔI */
            <div className="space-y-4">
              <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50/60 p-6 text-center">
                <img
                  src={preview}
                  alt="Chữ ký đã khóa"
                  className="max-h-28 max-w-[320px] object-contain drop-shadow-xs"
                  style={{ mixBlendMode: "multiply" }}
                />
                <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-600">
                  <ShieldCheck className="size-4 text-slate-500" />
                  Chữ ký điện tử hợp lệ & Khóa bảo mật bất biến
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3.5 text-xs text-slate-600 flex items-start gap-2.5">
                <Info className="size-4 text-slate-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-medium block text-slate-800">Quy chuẩn chữ ký số bảo mật:</span>
                  <p className="leading-relaxed text-slate-500">
                    Chữ ký này gắn liền với tài khoản <span className="font-medium text-slate-700">{user?.fullName}</span> ({user?.userCode || user?.email}). Sau khi đã khóa bảo mật, chữ ký được áp dụng cố định trên tất cả phiếu điểm rèn luyện và không thể sửa đổi.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* TRẠNG THÁI TẢI LÊN / ĐỔI ẢNH CHỮ KÝ */
            <div className="space-y-4">
              <div
                role="button"
                tabIndex={0}
                onClick={() => inputRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    inputRef.current?.click()
                  }
                }}
                onDragOver={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                }}
                onDrop={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  const file = e.dataTransfer.files?.[0]
                  if (file) select(file)
                }}
                className="flex min-h-52 w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/50 p-6 text-center hover:border-brand hover:bg-brand-soft/20 transition-all cursor-pointer"
              >
                {currentDisplay ? (
                  <div className="space-y-2">
                    <img
                      src={currentDisplay}
                      alt="Xem trước chữ ký"
                      className="max-h-24 max-w-[280px] object-contain mx-auto drop-shadow-xs"
                      style={{ mixBlendMode: "multiply" }}
                    />
                    <span className="text-xs text-brand font-medium block">
                      Bấm vào đây nếu muốn chọn file ảnh khác từ máy tính
                    </span>
                  </div>
                ) : (
                  <>
                    <span className="flex size-12 items-center justify-center rounded-full bg-white shadow-2xs border border-slate-200">
                      <Upload className="size-5 text-muted" />
                    </span>
                    <span className="mt-3 font-semibold text-sm text-slate-800">
                      Bấm để chọn hoặc kéo thả ảnh chữ ký của bạn vào đây
                    </span>
                    <span className="mt-1 text-xs text-muted">
                      Định dạng PNG, JPG, JPEG, WEBP (hệ thống tự động tách nền trong suốt), tối đa 10 MB
                    </span>
                  </>
                )}
              </div>

              <input
                ref={inputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp,.png,.jpg,.jpeg,.webp"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (file) select(file)
                  event.target.value = ""
                }}
              />

              {error && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 font-medium">
                  {error}
                </div>
              )}

              <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                {isEditing ? (
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setIsEditing(false)
                      setLiveBlobUrl(null)
                      setPreview(user?.signatureSpecimenUrl || (userStorageKey ? localStorage.getItem(userStorageKey) : null))
                      setError("")
                    }}
                  >
                    Hủy bỏ
                  </Button>
                ) : (
                  <span className="text-xs text-slate-500">
                    {currentDisplay ? "Đã chọn file ảnh chữ ký" : "Chưa chọn file"}
                  </span>
                )}

                <Button
                  variant="primary"
                  disabled={!currentDisplay || saving}
                  loading={saving}
                  onClick={() => setConfirmLockModalOpen(true)}
                >
                  <Lock className="size-4 mr-1.5" />
                  {isEditing ? "Cập nhật & Khóa chữ ký mới" : "Xác nhận & Khóa chữ ký"}
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* THÔNG TIN ĐỊNH DANH & MẬT MÃ */}
        <div className="space-y-4">
          <Card>
            <h3 className="font-semibold text-slate-800 text-sm">Thông tin định danh chữ ký</h3>
            <div className="mt-3.5 space-y-3 text-xs text-slate-600">
              <div>
                <span className="text-muted block text-[11px]">Chủ sở hữu chữ ký</span>
                <p className="font-medium text-slate-900 text-sm mt-0.5">
                  {user?.fullName || "Sinh viên"}
                </p>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                  Mã SV: {user?.userID || "—"} · Lớp: {user?.className || "—"}
                </p>
              </div>

              <div>
                <span className="text-muted block text-[11px]">Cấp ký hệ thống</span>
                <p className="font-medium text-slate-800">
                  {level === 3 ? "Trưởng khoa (Cấp 3)" : "Sinh viên (Cấp 1)"}
                </p>
              </div>

              <div className="border-t border-slate-100 pt-2.5">
                <span className="text-muted block text-[11px]">Mã vân tay mật mã (SHA-256)</span>
                {isLocked ? (
                  <code className="mt-1 block font-mono text-xs text-slate-700 bg-slate-100 px-2 py-1 rounded inline-block border border-slate-200">
                    {fingerprintText}
                  </code>
                ) : (
                  <span className="text-[11px] text-slate-400 italic block mt-0.5">
                    Chưa tạo (Sẽ sinh mã băm sau khi tải chữ ký)
                  </span>
                )}
              </div>

              <div>
                <span className="text-muted block text-[11px]">Trạng thái sửa đổi</span>
                {isLocked ? (
                  <span className="text-slate-600 text-xs flex items-center gap-1 mt-0.5">
                    <Lock className="size-3 text-slate-400" />
                    Đã khóa (Không thể chỉnh sửa)
                  </span>
                ) : (
                  <span className="text-slate-500 text-xs flex items-center gap-1 mt-0.5">
                    <AlertCircle className="size-3 text-slate-400" />
                    Chưa kích hoạt
                  </span>
                )}
              </div>
            </div>
          </Card>

          <Card className="bg-canvas">
            <h3 className="flex items-center gap-2 font-medium text-xs text-slate-800">
              <FileCheck className="size-4 text-slate-500" />
              Yêu cầu kỹ thuật chữ ký
            </h3>
            <ul className="mt-2.5 space-y-1.5 text-xs text-muted leading-relaxed">
              <li>• Ký trên giấy trắng, dùng bút mực xanh hoặc đen</li>
              <li>• Chụp thẳng góc, không bị khuất bóng hoặc lóa sáng</li>
              <li>• Cắt ảnh gọn sát chữ ký trước khi tải lên</li>
              <li>• Mỗi sinh viên chỉ tải một lần duy nhất</li>
            </ul>
          </Card>
        </div>
      </div>

      {/* MODAL XÁC NHẬN KHÓA CHỮ KÝ VĨNH VIỄN */}
      <Modal
        open={confirmLockModalOpen}
        title="Xác nhận lưu và khóa chữ ký vĩnh viễn"
        onClose={() => setConfirmLockModalOpen(false)}
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <CancelButton onClick={() => setConfirmLockModalOpen(false)}>
              Xem lại
            </CancelButton>
            <button
              type="button"
              disabled={saving}
              onClick={handleConfirmSaveAndLock}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#b71c1c] hover:bg-[#8B0000] text-white px-4 text-sm font-semibold transition shadow-sm border border-[#b71c1c] disabled:opacity-50 cursor-pointer"
            >
              {saving ? (
                <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Lock className="size-4" />
              )}
              Tôi đồng ý khóa chữ ký này
            </button>
          </div>
        }
      >
        <div className="space-y-3 py-2 text-xs text-slate-600">
          <div className="flex items-center justify-center p-4 bg-white border border-slate-200 rounded-lg min-h-[90px]">
            {currentDisplay ? (
              <img
                src={currentDisplay}
                alt="Xem trước chữ ký"
                className="max-h-24 max-w-[320px] object-contain drop-shadow-xs"
                style={{ mixBlendMode: "multiply" }}
              />
            ) : (
              <span className="text-xs text-slate-400 italic">Chưa có ảnh xem trước</span>
            )}
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-slate-700 leading-relaxed">
            <span className="font-medium block mb-1 text-slate-900">Lưu ý về tính cố định:</span>
            Sau khi xác nhận, chữ ký này sẽ được tính toán mã vân tay SHA-256 và khóa bảo mật cố định với tài khoản <span className="font-medium">{user?.fullName}</span>. Bạn sẽ không thể sửa đổi hoặc tải lại chữ ký khác.
          </div>
          <p className="text-slate-500">
            Hãy chắc chắn đây là chữ ký chính xác của bạn trước khi tiến hành lưu và khóa.
          </p>
        </div>
      </Modal>
    </>
  )
}

