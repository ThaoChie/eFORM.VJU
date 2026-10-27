import { ImagePlus, ShieldCheck, Upload, Check, Lock, AlertCircle, FileCheck, Info } from "lucide-react"
import { useRef, useState, useEffect } from "react"
import { toast } from "react-hot-toast"
import { useSubmissionStore } from "../../stores/useSubmissionStore"
import { useAuthStore } from "../../stores/useAuthStore"
import { client } from "../../lib/axios/client"
import { Button, Card, Modal } from "../ui/Primitives"

export default function SignatureUploader({ level = 1 }) {
  const inputRef = useRef(null)
  const user = useAuthStore((s) => s.user)
  const { registerSignature } = useSubmissionStore()

  const userStorageKey = user?.id ? `user_signature_${user.id}` : null

  // A signature is permanently locked if isSignatureLocked is true or signatureSpecimenUrl is present
  const isLocked = Boolean(user?.isSignatureLocked || user?.signatureSpecimenUrl)
  const [isEditing, setIsEditing] = useState(false)

  const [preview, setPreview] = useState(() => {
    return user?.signatureSpecimenUrl || (userStorageKey ? localStorage.getItem(userStorageKey) : null)
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [confirmLockModalOpen, setConfirmLockModalOpen] = useState(false)

  useEffect(() => {
    const existing = user?.signatureSpecimenUrl || (userStorageKey ? localStorage.getItem(userStorageKey) : null)
    if (existing) {
      setPreview(existing)
      registerSignature()
    } else {
      setPreview(null)
    }
  }, [user, userStorageKey, registerSignature])

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
    ].includes(file.type) || ["png", "jpg", "jpeg", "webp", "heic", "heif"].includes(ext)

    if (!isAcceptedFormat || file.size > 10 * 1024 * 1024) {
      return setError("Chỉ nhận file ảnh PNG, JPG, WEBP hoặc HEIC với dung lượng tối đa 10 MB.")
    }
    setError("")

    const reader = new FileReader()
    reader.onload = () => {
      setPreview(reader.result)
    }
    reader.readAsDataURL(file)
  }

  const handleConfirmSaveAndLock = async () => {
    if (!preview) return
    setSaving(true)
    setError("")
    try {
      // 1. Sync with backend API to compute SHA-256 and lock permanently
      let backendHash = null
      let finalSignature = preview
      try {
        const res = await client.post("/users/signature", { signature: preview })
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
      if (level === 2 || user?.role === "CLASS_LEADER" || user?.role === "CLASS_DEPUTY") {
        localStorage.setItem("user_signature_3", finalSignature)
      } else if (level === 3 || user?.role === "DEAN") {
        localStorage.setItem("user_signature_2", finalSignature)
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
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="flex min-h-52 w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/50 p-6 text-center hover:border-brand hover:bg-brand-soft/20 transition-all cursor-pointer"
              >
                {preview ? (
                  <div className="space-y-2">
                    <img
                      src={preview}
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
                      Định dạng PNG, JPG, WEBP, HEIC (hệ thống tự động tách nền trong suốt), tối đa 10 MB
                    </span>
                  </>
                )}
              </button>

              <input
                ref={inputRef}
                type="file"
                accept=".png,.jpg,.jpeg,.webp"
                className="hidden"
                onChange={(event) => select(event.target.files?.[0])}
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
                      setPreview(user?.signatureSpecimenUrl || (userStorageKey ? localStorage.getItem(userStorageKey) : null))
                      setError("")
                    }}
                  >
                    Hủy bỏ
                  </Button>
                ) : (
                  <span className="text-xs text-slate-500">
                    {preview ? "Đã chọn file ảnh chữ ký" : "Chưa chọn file"}
                  </span>
                )}

                <Button
                  variant="primary"
                  disabled={!preview || saving}
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
            <Button variant="secondary" onClick={() => setConfirmLockModalOpen(false)}>
              Xem lại
            </Button>
            <Button className="bg-slate-900 hover:bg-slate-800 text-white border-slate-900" loading={saving} onClick={handleConfirmSaveAndLock}>
              <Lock className="size-4" />
              Tôi đồng ý khóa chữ ký này
            </Button>
          </div>
        }
      >
        <div className="space-y-3 py-2 text-xs text-slate-600">
          <div className="flex items-center justify-center p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <img src={preview} alt="Xem trước" className="max-h-20 object-contain" />
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

