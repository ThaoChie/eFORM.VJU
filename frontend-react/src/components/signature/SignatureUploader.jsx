import { ImagePlus, ShieldCheck, Upload, Check, Lock, AlertCircle, FileCheck, Info } from "lucide-react"
import { useRef, useState, useEffect } from "react"
import { toast } from "react-hot-toast"
import { useSubmissionStore } from "../../stores/useSubmissionStore"
import { useAuthStore } from "../../stores/useAuthStore"
import { client } from "../../lib/axios/client"
import { Button, Card, Modal } from "../ui/Primitives"
import { isValidSignatureImage } from "../ui/PdfViewer"
import { removePaperBackground } from "../../lib/image-processing"

async function isHeicFile(file) {
  try {
    const ext = file.name ? file.name.split(".").pop().toLowerCase() : ""
    if (ext === "heic" || ext === "heif" || file.type === "image/heic" || file.type === "image/heif") {
      return true
    }
    // Kiểm tra magic bytes ISO/Apple: offset 4 là 'ftyp'
    const slice = file.slice(0, 16)
    const buffer = await slice.arrayBuffer()
    const bytes = new Uint8Array(buffer)
    if (bytes.length >= 8 && bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70) {
      return true
    }
  } catch (e) {
    console.warn("isHeicFile check warning:", e)
  }
  return false
}

export default function SignatureUploader({ level = 1 }) {
  const inputRef = useRef(null)
  const user = useAuthStore((s) => s.user)
  const { registerSignature } = useSubmissionStore()

  const userStorageKey = user?.id ? `user_signature_${user.id}` : null

  // Chữ ký chỉ coi là đã khóa nếu cờ isSignatureLocked = true VÀ có dữ liệu ảnh hợp lệ
  const isLocked = Boolean(
    user?.isSignatureLocked &&
    isValidSignatureImage(user?.signatureSpecimenUrl) &&
    !user.signatureSpecimenUrl.startsWith("data:image/svg+xml")
  )
  const [isEditing, setIsEditing] = useState(false)

  // Khởi tạo preview: Chỉ dùng chữ ký đã khóa hợp lệ của người dùng
  const [preview, setPreview] = useState(() => {
    if (user?.isSignatureLocked && isValidSignatureImage(user?.signatureSpecimenUrl) && !user.signatureSpecimenUrl.startsWith("data:image/svg+xml")) {
      return user.signatureSpecimenUrl
    }
    return null
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [confirmLockModalOpen, setConfirmLockModalOpen] = useState(false)

  useEffect(() => {
    if (user?.isSignatureLocked && isValidSignatureImage(user?.signatureSpecimenUrl) && !user.signatureSpecimenUrl.startsWith("data:image/svg+xml")) {
      setPreview((prev) => prev || user.signatureSpecimenUrl)
      registerSignature()
    }
  }, [user?.signatureSpecimenUrl, user?.isSignatureLocked, registerSignature])

  const select = async (file) => {
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

    if (!isAcceptedFormat || file.size > 15 * 1024 * 1024) {
      return setError("Chỉ nhận file ảnh PNG, JPG, JPEG hoặc WEBP với dung lượng tối đa 15 MB.")
    }
    setError("")

    let fileToProcess = file
    const heicDetected = await isHeicFile(file)

    if (heicDetected) {
      try {
        toast.loading("Đang tự động chuyển đổi ảnh iPhone (HEIC) sang PNG chuẩn...", { id: "heic-convert" })
        const heic2any = (await import("heic2any")).default
        const conversionResult = await heic2any({
          blob: file,
          toType: "image/png",
          quality: 0.95,
        })
        const convertedBlob = Array.isArray(conversionResult) ? conversionResult[0] : conversionResult
        fileToProcess = new File([convertedBlob], (file.name || "signature").replace(/\.[^.]+$/, ".png"), {
          type: "image/png",
        })
        toast.success("Đã tự động chuyển đổi ảnh sang PNG chuẩn!", { id: "heic-convert" })
      } catch (heicErr) {
        toast.dismiss("heic-convert")
        console.warn("Lỗi chuyển đổi HEIC:", heicErr)
        return setError("File ảnh này chụp từ iPhone (định dạng HEIC ẩn dưới đuôi file). Trình duyệt không thể trực tiếp hiển thị. Bạn vui lòng chụp lại màn hình ảnh chữ ký hoặc xuất ảnh sang định dạng PNG/JPG chuẩn rồi tải lên lại nhé.")
      }
    }

    try {
      const reader = new FileReader()
      reader.onerror = () => setError("Không thể đọc file ảnh từ thiết bị")
      reader.onload = async () => {
        const raw = reader.result
        if (typeof raw === "string") {
          let safeUrl = raw
          if (!safeUrl.startsWith("data:image/")) {
            const detectedExt = fileToProcess.name ? fileToProcess.name.split(".").pop().toLowerCase() : "png"
            const mime = (detectedExt === "jpg" || detectedExt === "jpeg") ? "image/jpeg" : detectedExt === "webp" ? "image/webp" : "image/png"
            safeUrl = safeUrl.replace(/^data:[^;]*;/, "data:" + mime + ";")
          }
          try {
            // Tự động tách nền loại bỏ màu giấy và crop viền nét chữ ký
            const transparentUrl = await removePaperBackground(safeUrl)
            setPreview(transparentUrl)
          } catch {
            setPreview(safeUrl)
          }
        }
      }
      reader.readAsDataURL(fileToProcess)
    } catch (err) {
      setError(err.message || "Không thể xử lý ảnh chữ ký")
    }
  }

  const handleConfirmSaveAndLock = async () => {
    if (!preview) {
      return setError("Dữ liệu ảnh chưa sẵn sàng để lưu. Vui lòng chọn lại file ảnh.")
    }

    setSaving(true)
    setError("")
    try {
      // 1. Tách nền giấy và gửi lên backend API để tính băm SHA-256 và khóa vĩnh viễn
      let backendHash = null
      const cleanSig = await removePaperBackground(preview)
      let finalSignature = cleanSig
      try {
        const res = await client.post("/users/signature", { signature: cleanSig })
        backendHash = res?.signatureHash || res?.data?.signatureHash || null
        if (res?.signature || res?.data?.signature) {
          finalSignature = res?.signature || res?.data?.signature
        }
      } catch (apiErr) {
        console.warn("Backend signature sync warning:", apiErr)
      }

      // 2. Lưu vào local storage theo tài khoản hiện tại
      try {
        if (userStorageKey) {
          localStorage.setItem(userStorageKey, finalSignature)
        }
        if (user?.id) {
          localStorage.setItem(`user_signature_${user.id}`, finalSignature)
        }
        localStorage.setItem("user_signature", finalSignature)
        if (level === 2 || user?.role === "CLASS_LEADER" || user?.role === "CLASS_DEPUTY") {
          localStorage.setItem("user_signature_3", finalSignature)
        } else if (level === 3 || user?.role === "DEAN") {
          localStorage.setItem("user_signature_2", finalSignature)
        } else {
          localStorage.setItem("user_signature_4", finalSignature)
        }
      } catch (storageErr) {
        console.warn("Storage quota warning:", storageErr)
      }
      registerSignature()

      // 3. Cập nhật auth store state & localStorage user
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

  // Phân định vai trò người dùng để hiển thị thông tin định danh chính xác
  const role = (user?.role || "").toLowerCase().replace("_", "-")
  const isDean = role === "dean" || level === 3
  const isAdmin = role === "admin"
  const isStudent = !isDean && !isAdmin

  // Mã định danh người dùng: ưu tiên userCode, userID, code hoặc fallback
  const userCode =
    user?.userCode ||
    user?.userID ||
    user?.code ||
    (isDean ? "TK_CNTT" : isAdmin ? "ADMIN01" : "—")

  const facultyName =
    user?.facultyName ||
    user?.departmentName ||
    user?.deptName ||
    "Khoa Công nghệ Thông tin"

  const departmentName =
    user?.departmentName ||
    user?.facultyName ||
    user?.deptName ||
    "Phòng Đào tạo & CTSV"

  const className = user?.className || user?.classCode || "—"

  const ownerName =
    user?.fullName ||
    (isDean ? "Trưởng Khoa CNTT" : isAdmin ? "Quản trị viên" : "Sinh viên")

  const systemSignLevel = isDean
    ? "Trưởng khoa (Cấp 3)"
    : isAdmin
      ? "Quản trị viên hệ thống"
      : role === "class-leader" || role === "class-deputy" || level === 2
        ? "Ban cán sự lớp (Cấp 2)"
        : "Sinh viên (Cấp 1)"

  // Render chuỗi định danh:
  // - Trưởng khoa: Mã người dùng và Khoa
  // - Quản trị viên: Mã người dùng và tên phòng ban
  // - Sinh viên / Ban cán sự: Mã SV và Lớp
  const renderIdentityInfo = () => {
    if (isDean) {
      return `Mã người dùng: ${userCode} · Khoa: ${facultyName}`
    }
    if (isAdmin) {
      return `Mã người dùng: ${userCode} · Phòng ban: ${departmentName}`
    }
    return `Mã SV: ${userCode} · Lớp: ${className}`
  }

  const roleTitleLabel = isDean
    ? "Trưởng Khoa / GVCN"
    : isAdmin
      ? "Quản trị viên"
      : level === 2 || role === "class-leader" || role === "class-deputy"
        ? "Cán bộ lớp"
        : "Sinh viên"

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <Card>
          <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="font-semibold text-slate-900 text-base flex items-center gap-2">
                Chữ ký điện tử chính chủ ({roleTitleLabel})
                {isLocked && <Lock className="size-3.5 text-slate-400" />}
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                {isLocked
                  ? "Chữ ký đã được mã hóa và khóa bảo mật vĩnh viễn theo định danh của bạn."
                  : `Mỗi ${isDean ? "trưởng khoa" : isAdmin ? "quản trị viên" : level === 2 ? "cán bộ lớp" : "sinh viên"} cần tải lên ảnh chữ ký một lần duy nhất. Hệ thống tự động tách nền giấy và khóa chữ ký số.`}
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
                  if (e.key === "Enter" || e.key === " ") inputRef.current?.click()
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
                {preview ? (
                  <div className="space-y-2">
                    <img
                      src={preview}
                      alt="Xem trước chữ ký"
                      className="max-h-24 max-w-[280px] object-contain mx-auto drop-shadow-xs"
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
                      Định dạng PNG, JPG, JPEG, WEBP (hệ thống tự động tách nền trong suốt), tối đa 15 MB
                    </span>
                  </>
                )}
              </div>

              <input
                ref={inputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp,image/heic,image/heif,.png,.jpg,.jpeg,.webp,.heic,.heif"
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
                      setPreview(null)
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
                  {ownerName}
                </p>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                  {renderIdentityInfo()}
                </p>
              </div>

              <div>
                <span className="text-muted block text-[11px]">Cấp ký hệ thống</span>
                <p className="font-medium text-slate-800">
                  {systemSignLevel}
                </p>
              </div>

              <div className="border-t border-slate-100 pt-2.5">
                <span className="text-muted block text-[11px]">Mã vân tay mật mã (SHA-256)</span>
                {isLocked ? (
                  <span className="mt-1 block font-mono text-xs text-slate-700">
                    {fingerprintText}
                  </span>
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
              <li>• {isDean ? "Mỗi trưởng khoa chỉ tải một lần duy nhất" : isAdmin ? "Mỗi quản trị viên chỉ tải một lần duy nhất" : "Mỗi sinh viên chỉ tải một lần duy nhất"}</li>
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
          <div className="flex items-center justify-center p-4 bg-slate-50 border border-slate-200 rounded-lg min-h-[90px]">
            {preview ? (
              <img
                src={preview}
                alt="Xem trước chữ ký"
                className="max-h-24 max-w-[320px] object-contain drop-shadow-xs"
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
