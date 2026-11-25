import { ImagePlus, ShieldCheck, Upload, Check, Lock, AlertCircle, FileCheck, Info, RotateCw, RotateCcw, Crop, Scissors, RefreshCw, PenLine, Unlock } from "lucide-react"
import { useRef, useState, useEffect } from "react"
import { toast } from "react-hot-toast"
import { useSubmissionStore } from "../../stores/useSubmissionStore"
import { useAuthStore } from "../../stores/useAuthStore"
import { client } from "../../lib/axios/client"
import { Button, Card, Modal } from "../ui/Primitives"
import { isValidSignatureImage } from "../ui/PdfViewer"
import {
  removePaperBackground,
  rotateSignatureImage90,
  detectTightSignatureCropBox,
  cropSignatureImage,
} from "../../lib/image-processing"

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

  const hasExistingSignature = Boolean(
    isValidSignatureImage(user?.signatureSpecimenUrl) &&
    !user.signatureSpecimenUrl.startsWith("data:image/svg+xml")
  )
  // Chữ ký chỉ coi là đã khóa nếu cờ isSignatureLocked = true VÀ có dữ liệu ảnh hợp lệ
  const isLocked = Boolean(user?.isSignatureLocked && hasExistingSignature)
  const [isEditing, setIsEditing] = useState(false)
  const [hasNewUpload, setHasNewUpload] = useState(false)

  // Khởi tạo preview: Hiển thị chữ ký hiện có của người dùng (kể cả khi Admin vừa mở khóa quyền thay đổi)
  const [preview, setPreview] = useState(() => {
    if (hasExistingSignature) {
      return user.signatureSpecimenUrl
    }
    return null
  })
  const [rawPreview, setRawPreview] = useState(null)
  const [originalUploadUrl, setOriginalUploadUrl] = useState(null)
  const [imgDims, setImgDims] = useState({ width: 0, height: 0 })
  const [rotationAngle, setRotationAngle] = useState(0)
  const [isCropMode, setIsCropMode] = useState(false)
  const [cropRect, setCropRect] = useState({ x: 0, y: 0, width: 300, height: 100 })
  const cropImgRef = useRef(null)
  const dragStateRef = useRef(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [confirmLockModalOpen, setConfirmLockModalOpen] = useState(false)
  const [confirmReplaceModalOpen, setConfirmReplaceModalOpen] = useState(false)

  useEffect(() => {
    if (hasExistingSignature && !isEditing) {
      setPreview(user.signatureSpecimenUrl)
      registerSignature()
    }
  }, [user?.signatureSpecimenUrl, hasExistingSignature, isEditing, registerSignature])

  const MAX_SIGNATURE_SIZE_BYTES = 2 * 1024 * 1024 // 2MB
  const MIN_SIGNATURE_WIDTH = 300
  const MIN_SIGNATURE_HEIGHT = 100
  const ERR_MAX_SIZE_MSG = "ERR-012: File vượt quá dung lượng tối đa 2MB."
  const ERR_MIN_DIM_MSG = "ERR-013: Ảnh nhỏ hơn kích thước tối thiểu (300×100px)."

  const getImageDimensions = (dataUrl) =>
    new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        resolve({
          width: img.naturalWidth || img.width || 0,
          height: img.naturalHeight || img.height || 0,
        })
      }
      img.onerror = () => reject(new Error("Không thể đọc kích thước file ảnh"))
      img.src = dataUrl
    })

  const getFilePixelDimensions = async (fileObj) => {
    try {
      const headerSlice = fileObj.slice(0, 32)
      const buf = await headerSlice.arrayBuffer()
      const bytes = new Uint8Array(buf)
      // PNG signature: 89 50 4E 47 0D 0A 1A 0A, IHDR width at offset 16..19, height at 20..23
      if (
        bytes.length >= 24 &&
        bytes[0] === 0x89 &&
        bytes[1] === 0x50 &&
        bytes[2] === 0x4e &&
        bytes[3] === 0x47
      ) {
        const view = new DataView(buf)
        const w = view.getUint32(16, false)
        const h = view.getUint32(20, false)
        if (w > 0 && h > 0) {
          return { width: w, height: h }
        }
      }
    } catch {}

    if (typeof createImageBitmap === "function") {
      try {
        const bmp = await createImageBitmap(fileObj)
        const dims = { width: bmp.width || 0, height: bmp.height || 0 }
        if (typeof bmp.close === "function") bmp.close()
        if (dims.width > 0 && dims.height > 0) {
          return dims
        }
      } catch {}
    }
    return null
  }

  const select = async (file) => {
    if (!file) return

    if (!isLocked) {
      setPreview(null)
    }
    if (inputRef.current) {
      inputRef.current.value = ""
    }

    const ext = file.name ? file.name.split(".").pop().toLowerCase() : ""
    const isAcceptedFormat = [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/webp",
      "image/heic",
      "image/heif",
    ].includes(file.type?.toLowerCase()) || ["png", "jpg", "jpeg", "webp", "heic", "heif"].includes(ext)

    if (file.size > MAX_SIGNATURE_SIZE_BYTES) {
      setPreview(null)
      toast.error(ERR_MAX_SIZE_MSG)
      return setError(ERR_MAX_SIZE_MSG)
    }

    if (!isAcceptedFormat) {
      setPreview(null)
      toast.error("Định dạng file không hợp lệ. Chỉ chấp nhận ảnh PNG, JPG, JPEG, WEBP hoặc HEIC.")
      return setError("Chỉ nhận file ảnh PNG, JPG, JPEG, WEBP hoặc HEIC với dung lượng tối đa 2MB.")
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
        if (convertedBlob.size > MAX_SIGNATURE_SIZE_BYTES) {
          toast.dismiss("heic-convert")
          setPreview(null)
          toast.error(ERR_MAX_SIZE_MSG)
          return setError(ERR_MAX_SIZE_MSG)
        }
        fileToProcess = new File([convertedBlob], (file.name || "signature").replace(/\.[^.]+$/, ".png"), {
          type: "image/png",
        })
        toast.success("Đã tự động chuyển đổi ảnh sang PNG chuẩn!", { id: "heic-convert" })
      } catch (heicErr) {
        toast.dismiss("heic-convert")
        console.warn("Lỗi chuyển đổi HEIC:", heicErr)
        setPreview(null)
        return setError("File ảnh này chụp từ iPhone (định dạng HEIC ẩn dưới đuôi file). Trình duyệt không thể trực tiếp hiển thị. Bạn vui lòng chụp lại màn hình ảnh chữ ký hoặc xuất ảnh sang định dạng PNG/JPG chuẩn rồi tải lên lại nhé.")
      }
    }

    const binaryDims = await getFilePixelDimensions(fileToProcess)
    if (binaryDims && (binaryDims.width < MIN_SIGNATURE_WIDTH || binaryDims.height < MIN_SIGNATURE_HEIGHT)) {
      setPreview(null)
      setRawPreview(null)
      toast.error(ERR_MIN_DIM_MSG)
      return setError(ERR_MIN_DIM_MSG)
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
          let loadedW = 0
          let loadedH = 0
          try {
            const { width, height } = await getImageDimensions(safeUrl)
            loadedW = width
            loadedH = height
            if (width < MIN_SIGNATURE_WIDTH || height < MIN_SIGNATURE_HEIGHT) {
              setPreview(null)
              setRawPreview(null)
              toast.error(ERR_MIN_DIM_MSG)
              setError(ERR_MIN_DIM_MSG)
              return
            }
          } catch {
            setPreview(null)
            setRawPreview(null)
            return setError("Không thể đọc kích thước ảnh chữ ký. Vui lòng chọn file ảnh hợp lệ.")
          }

          setRawPreview(safeUrl)
          setOriginalUploadUrl(safeUrl)
          setHasNewUpload(true)
          setRotationAngle(0)
          setIsCropMode(false)
          try {
            // Tách nền giấy nhưng giữ nguyên kích thước ảnh để người dùng có thể Xoay 90° và Cắt sát lề
            const transparentUrl = await removePaperBackground(safeUrl, { autoTrim: false })
            const dims = await getImageDimensions(transparentUrl).catch(() => ({ width: loadedW, height: loadedH }))
            setImgDims(dims)
            setCropRect({
              x: 0,
              y: 0,
              width: dims.width || loadedW,
              height: dims.height || loadedH,
            })
            setPreview(transparentUrl)
          } catch {
            setImgDims({ width: loadedW, height: loadedH })
            setCropRect({ x: 0, y: 0, width: loadedW, height: loadedH })
            setPreview(safeUrl)
          }
        }
      }
      reader.readAsDataURL(fileToProcess)
    } catch (err) {
      setError(err.message || "Không thể xử lý ảnh chữ ký")
    }
  }

  // Công cụ Xoay 90° (theo chiều kim đồng hồ hoặc ngược chiều)
  const handleRotate90 = async (direction = 1) => {
    if (!preview) return
    try {
      setError("")
      const rotated = await rotateSignatureImage90(preview, direction, MIN_SIGNATURE_WIDTH, MIN_SIGNATURE_HEIGHT)
      setPreview(rotated.dataUrl)
      setRawPreview(rotated.dataUrl)
      setImgDims({ width: rotated.width, height: rotated.height })
      setRotationAngle((prev) => (prev + (direction >= 0 ? 90 : 270)) % 360)
      if (isCropMode) {
        const tight = await detectTightSignatureCropBox(rotated.dataUrl, MIN_SIGNATURE_WIDTH, MIN_SIGNATURE_HEIGHT)
        if (tight) {
          setCropRect({ x: tight.x, y: tight.y, width: tight.width, height: tight.height })
        } else {
          setCropRect({ x: 0, y: 0, width: rotated.width, height: rotated.height })
        }
      } else {
        setCropRect({ x: 0, y: 0, width: rotated.width, height: rotated.height })
      }
      toast.success(`Đã xoay ảnh 90° (${rotated.width}×${rotated.height}px)`)
    } catch (err) {
      toast.error(err?.message || "Không thể xoay ảnh chữ ký")
    }
  }

  // Mở chế độ tùy chỉnh khung cắt (hoặc tự động khoanh vùng sát lề >= 300×100px)
  const handleToggleCropMode = async () => {
    if (!preview) return
    if (isCropMode) {
      setIsCropMode(false)
      return
    }
    setError("")
    const tight = await detectTightSignatureCropBox(preview, MIN_SIGNATURE_WIDTH, MIN_SIGNATURE_HEIGHT)
    if (tight) {
      setImgDims({ width: tight.imgWidth, height: tight.imgHeight })
      setCropRect({ x: tight.x, y: tight.y, width: tight.width, height: tight.height })
    } else if (imgDims.width > 0 && imgDims.height > 0) {
      setCropRect({
        x: 0,
        y: 0,
        width: Math.max(MIN_SIGNATURE_WIDTH, imgDims.width),
        height: Math.max(MIN_SIGNATURE_HEIGHT, imgDims.height),
      })
    }
    setIsCropMode(true)
  }

  // Cắt sát lề chữ ký tự động (vẫn đảm bảo kích thước ảnh sau cắt >= 300×100px)
  const handleTightAutoCrop = async () => {
    if (!preview) return
    try {
      setError("")
      const tight = await detectTightSignatureCropBox(preview, MIN_SIGNATURE_WIDTH, MIN_SIGNATURE_HEIGHT)
      const rectToUse = tight
        ? { x: tight.x, y: tight.y, width: tight.width, height: tight.height }
        : cropRect
      const cropped = await cropSignatureImage(preview, rectToUse, MIN_SIGNATURE_WIDTH, MIN_SIGNATURE_HEIGHT)
      setPreview(cropped.dataUrl)
      setRawPreview(cropped.dataUrl)
      setImgDims({ width: cropped.width, height: cropped.height })
      setCropRect({ x: 0, y: 0, width: cropped.width, height: cropped.height })
      setIsCropMode(false)
      toast.success(`Đã cắt sát lề chữ ký (${cropped.width}×${cropped.height}px ≥ 300×100px)`)
    } catch (err) {
      toast.error(err?.message || "Không thể cắt ảnh chữ ký")
    }
  }

  // Áp dụng vùng cắt đang chọn
  const handleApplyCrop = async () => {
    if (!preview) return
    try {
      setError("")
      const cropped = await cropSignatureImage(preview, cropRect, MIN_SIGNATURE_WIDTH, MIN_SIGNATURE_HEIGHT)
      setPreview(cropped.dataUrl)
      setRawPreview(cropped.dataUrl)
      setImgDims({ width: cropped.width, height: cropped.height })
      setCropRect({ x: 0, y: 0, width: cropped.width, height: cropped.height })
      setIsCropMode(false)
      toast.success(`Đã cắt ảnh chữ ký (${cropped.width}×${cropped.height}px ≥ 300×100px)`)
    } catch (err) {
      toast.error(err?.message || "Không thể áp dụng vùng cắt")
    }
  }

  // Khôi phục ảnh gốc vừa tải lên
  const handleResetOriginal = async () => {
    if (!originalUploadUrl) return
    try {
      setError("")
      const transparentUrl = await removePaperBackground(originalUploadUrl, { autoTrim: false })
      const dims = await getImageDimensions(transparentUrl)
      setPreview(transparentUrl)
      setRawPreview(originalUploadUrl)
      setImgDims(dims)
      setRotationAngle(0)
      setIsCropMode(false)
      setCropRect({ x: 0, y: 0, width: dims.width, height: dims.height })
      toast.success("Đã khôi phục về ảnh gốc ban đầu")
    } catch {}
  }

  // Xử lý kéo thả khung cắt trực quan trên ảnh xem trước
  const handleCropMouseDown = (e, mode) => {
    e.preventDefault()
    e.stopPropagation()
    const imgEl = cropImgRef.current
    if (!imgEl || !imgDims.width || !imgDims.height) return
    const bounds = imgEl.getBoundingClientRect()
    if (!bounds.width || !bounds.height) return

    dragStateRef.current = {
      mode,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startRect: { ...cropRect },
      scaleX: imgDims.width / bounds.width,
      scaleY: imgDims.height / bounds.height,
    }

    const handleMouseMove = (moveEvent) => {
      const st = dragStateRef.current
      if (!st) return
      const dx = Math.round((moveEvent.clientX - st.startClientX) * st.scaleX)
      const dy = Math.round((moveEvent.clientY - st.startClientY) * st.scaleY)
      const minW = Math.min(imgDims.width, MIN_SIGNATURE_WIDTH)
      const minH = Math.min(imgDims.height, MIN_SIGNATURE_HEIGHT)
      let { x, y, width, height } = st.startRect

      if (st.mode === "move") {
        x = Math.max(0, Math.min(imgDims.width - width, x + dx))
        y = Math.max(0, Math.min(imgDims.height - height, y + dy))
      } else {
        if (st.mode.includes("e")) {
          width = Math.max(minW, Math.min(imgDims.width - x, width + dx))
        }
        if (st.mode.includes("s")) {
          height = Math.max(minH, Math.min(imgDims.height - y, height + dy))
        }
        if (st.mode.includes("w")) {
          const maxLeftShift = width - minW
          const actualDx = Math.max(-x, Math.min(maxLeftShift, dx))
          x += actualDx
          width -= actualDx
        }
        if (st.mode.includes("n")) {
          const maxTopShift = height - minH
          const actualDy = Math.max(-y, Math.min(maxTopShift, dy))
          y += actualDy
          height -= actualDy
        }
      }
      setCropRect({ x, y, width, height })
    }

    const handleMouseUp = () => {
      dragStateRef.current = null
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
    }

    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleMouseUp)
  }

  const handleInitiateSave = async () => {
    if (!preview) {
      return setError("Dữ liệu ảnh chưa sẵn sàng để lưu. Vui lòng chọn lại file ảnh.")
    }
    setSaving(true)
    setError("")
    try {
      // Nếu đang ở chế độ thay đổi chữ ký nhưng user không tải ảnh mới -> giữ nguyên ảnh cũ để xác nhận lưu
      if (isEditing && !hasNewUpload && hasExistingSignature) {
        setConfirmLockModalOpen(true)
        return
      }

      let activePreview = preview
      if (isCropMode) {
        const cropped = await cropSignatureImage(preview, cropRect, MIN_SIGNATURE_WIDTH, MIN_SIGNATURE_HEIGHT)
        activePreview = cropped.dataUrl
        setPreview(cropped.dataUrl)
        setRawPreview(cropped.dataUrl)
        setImgDims({ width: cropped.width, height: cropped.height })
        setIsCropMode(false)
      }
      // Xác thực tách nền & kiểm tra kích thước hợp lệ (không kiểm tra trùng ảnh giữa các user theo BR-Signature)
      await removePaperBackground(activePreview, { autoTrim: false })
      setConfirmLockModalOpen(true)
    } catch (err) {
      const rawMsg = err?.response?.data?.message || err?.message || "Lỗi hệ thống"
      const displayMsg = rawMsg.startsWith("ERR-") ? rawMsg : "Không thể lưu chữ ký: " + rawMsg
      toast.error(displayMsg)
      setError(displayMsg)
    } finally {
      setSaving(false)
    }
  }

  const handleConfirmSaveAndLock = async () => {
    if (!preview) {
      return setError("Dữ liệu ảnh chưa sẵn sàng để lưu. Vui lòng chọn lại file ảnh.")
    }

    setSaving(true)
    setError("")
    try {
      let backendHash = null
      let finalSignature = preview

      // Nếu đang thay đổi chữ ký nhưng không tải ảnh mới -> giữ nguyên ảnh chữ ký cũ gửi lên BE để sinh hash & khóa lại
      const keepingOldSignature = isEditing && !hasNewUpload && hasExistingSignature

      if (!keepingOldSignature) {
        const cleanSig = await removePaperBackground(preview, { autoTrim: false })
        finalSignature = cleanSig

        // Kiểm tra dung lượng ảnh chữ ký trước khi gửi lên API (chặn vượt quá 2MB)
        if (cleanSig && cleanSig.startsWith("data:")) {
          const base64Data = cleanSig.split(",")[1] || ""
          const byteSize = Math.round(base64Data.length * 0.75)
          if (byteSize > MAX_SIGNATURE_SIZE_BYTES) {
            setSaving(false)
            setConfirmLockModalOpen(false)
            setPreview(null)
            setRawPreview(null)
            toast.error(ERR_MAX_SIZE_MSG)
            return setError(ERR_MAX_SIZE_MSG)
          }
        }
      }

      try {
        const res = await client.post("/users/signature", {
          signature: keepingOldSignature ? "" : finalSignature,
          rawSignature: keepingOldSignature ? "" : (rawPreview || preview),
        })
        backendHash = res?.signatureHash || res?.data?.signatureHash || null
        if (res?.signature || res?.data?.signature) {
          finalSignature = res?.signature || res?.data?.signature
        }
      } catch (apiErr) {
        console.warn("Backend signature sync warning:", apiErr)
        throw new Error(apiErr?.response?.data?.message || apiErr?.message || "Không thể lưu chữ ký")
      }

      // 2. Lưu vào local storage theo tài khoản hiện tại
      try {
        if (userStorageKey) {
          localStorage.setItem(userStorageKey, finalSignature)
        }
        if (user?.id) {
          localStorage.setItem(`user_signature_${user.id}`, finalSignature)
          if (rawPreview) {
            localStorage.setItem(`user_signature_raw_${user.id}`, rawPreview)
          }
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
          signatureUnlockedUntil: null,
          signatureHash: backendHash || "ENCRYPTED_SHA256",
          signatureRegisteredAt: new Date().toISOString(),
        }
        useAuthStore.setState({ user: updatedUser })
        try {
          localStorage.setItem("user", JSON.stringify(updatedUser))
        } catch {}
      }

      setPreview(finalSignature)
      setHasNewUpload(false)
      setIsEditing(false)
      setConfirmLockModalOpen(false)
      toast.success(
        keepingOldSignature
          ? "Đã xác nhận giữ nguyên chữ ký cũ và khóa bảo mật thành công!"
          : "Đã tải lên và khóa chữ ký điện tử thành công!"
      )
    } catch (e) {
      setConfirmLockModalOpen(false)
      const rawMsg = e?.response?.data?.message || e?.message || "Lỗi hệ thống"
      const displayMsg = rawMsg.startsWith("ERR-") ? rawMsg : "Không thể lưu chữ ký: " + rawMsg
      toast.error(displayMsg)
      setError(displayMsg)
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
                  ? "Chữ ký đã được mã hóa và khóa bảo mật theo định danh của bạn."
                  : hasExistingSignature
                    ? "Bạn đã được cấp quyền thay đổi chữ ký. Có thể tải ảnh mới hoặc giữ nguyên chữ ký cũ."
                    : `Mỗi ${isDean ? "trưởng khoa" : isAdmin ? "quản trị viên" : level === 2 ? "cán bộ lớp" : "sinh viên"} cần tải lên ảnh chữ ký một lần duy nhất. Hệ thống tự động tách nền giấy và khóa chữ ký số.`}
              </p>
            </div>
            {isLocked ? (
              <span className="inline-flex items-center gap-1.5 text-xs text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md shrink-0">
                <Lock className="size-3.5 text-slate-500" />
                Đã khóa bảo mật
              </span>
            ) : hasExistingSignature ? (
              <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md shrink-0">
                <Unlock className="size-3.5 text-emerald-600" />
                Đã mở quyền thay đổi
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md shrink-0">
                <AlertCircle className="size-3.5 text-slate-400" />
                Chưa có chữ ký
              </span>
            )}
          </div>

          {/* VÙNG HIỂN THỊ CHỮ KÝ */}
          {hasExistingSignature && !isEditing ? (
            /* TRẠNG THÁI ĐÃ CÓ CHỮ KÝ: HIỂN THỊ CHỮ KÝ HIỆN TẠI + NÚT THAY ĐỔI CHỮ KÝ */
            <div className="space-y-4">
              <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50/60 p-6 text-center">
                <img
                  src={preview || user?.signatureSpecimenUrl}
                  alt="Chữ ký hiện tại"
                  className="max-h-28 max-w-[320px] object-contain drop-shadow-xs"
                />
                <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-600">
                  <ShieldCheck className="size-4 text-slate-500" />
                  {isLocked
                    ? "Chữ ký điện tử hợp lệ & Khóa bảo mật"
                    : "Chữ ký hiện tại (Đang mở quyền cập nhật)"}
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3.5 text-xs text-slate-600 flex items-start gap-2.5">
                <Info className="size-4 text-slate-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-medium block text-slate-800">Quy chuẩn chữ ký số bảo mật:</span>
                  <p className="leading-relaxed text-slate-500">
                    Chữ ký này gắn liền với tài khoản <span className="font-medium text-slate-700">{user?.fullName}</span> ({user?.userCode || user?.email}).
                    {isLocked
                      ? " Khi cần thay đổi chữ ký mới, vui lòng liên hệ Quản trị viên để được cấp quyền mở khóa."
                      : user?.signatureUnlockedUntil
                        ? ` Quyền thay đổi chữ ký có hiệu lực đến ${new Date(user.signatureUnlockedUntil).toLocaleString("vi-VN")}.`
                        : " Bạn có thể tải ảnh mới hoặc xác nhận giữ nguyên chữ ký cũ."}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end border-t border-slate-100 pt-4">
                <Button
                  type="button"
                  variant={isLocked ? "secondary" : "primary"}
                  onClick={() => {
                    if (isLocked) {
                      toast("Chữ ký đang được khóa bảo mật. Vui lòng liên hệ Quản trị viên để cấp quyền thay đổi chữ ký.", {
                        icon: "🔒",
                      })
                      return
                    }
                    // Luồng 3a (UC-AUTH-03): Popup cảnh báo chữ ký mới chỉ áp dụng cho lần ký sau
                    setConfirmReplaceModalOpen(true)
                  }}
                >
                  <PenLine className="size-4 mr-1.5" />
                  Thay đổi chữ ký
                </Button>
              </div>
            </div>
          ) : (
            /* TRẠNG THÁI TẢI LÊN / CHỈNH SỬA (XOAY 90° & CẮT ẢNH) TRƯỚC KHI LƯU */
            <div className="space-y-4">
              {isEditing && (
                <div className="rounded-lg border border-sky-200 bg-sky-50/70 px-3.5 py-2.5 text-xs text-sky-800 flex items-start gap-2">
                  <Info className="size-4 text-sky-600 shrink-0 mt-0.5" />
                  <span>
                    Bạn có thể chọn ảnh chữ ký mới bên dưới, hoặc nhấn <b>"Cập nhật & Lưu chữ ký"</b> ngay nếu muốn giữ nguyên ảnh chữ ký cũ.
                  </span>
                </div>
              )}
              <div
                role="button"
                tabIndex={0}
                onClick={() => {
                  if (!preview) inputRef.current?.click()
                }}
                onKeyDown={(e) => {
                  if (!preview && (e.key === "Enter" || e.key === " ")) inputRef.current?.click()
                }}
                onDragEnter={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                }}
                onDragOver={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                }}
                onDrop={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  const file = e.dataTransfer?.files?.[0]
                  if (file) select(file)
                }}
                className={`flex min-h-52 w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/50 p-5 text-center transition-all ${
                  preview ? "cursor-default" : "hover:border-brand hover:bg-brand-soft/20 cursor-pointer"
                }`}
              >
                {preview ? (
                  <div className="w-full space-y-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-between text-xs text-slate-600 px-1">
                      <span className="font-medium text-slate-700">
                        Bản xem trước chữ ký {rotationAngle > 0 ? `(Đã xoay ${rotationAngle}°)` : ""}
                      </span>
                      {imgDims.width > 0 && imgDims.height > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 font-mono">
                          <Check className="size-3" />
                          {isCropMode
                            ? `Vùng cắt: ${cropRect.width}×${cropRect.height}px`
                            : `Kích thước: ${imgDims.width}×${imgDims.height}px`}
                        </span>
                      )}
                    </div>

                    {/* Khung hiển thị ảnh & Vùng cắt trực quan */}
                    <div className="relative inline-block mx-auto rounded-lg border border-slate-200 bg-white p-2 shadow-2xs select-none overflow-hidden">
                      <div className="relative inline-block">
                        <img
                          ref={cropImgRef}
                          src={preview}
                          alt="Xem trước chữ ký"
                          draggable={false}
                          className="max-h-56 max-w-full object-contain block mx-auto"
                        />

                        {isCropMode && imgDims.width > 0 && imgDims.height > 0 && (
                          <div
                            onMouseDown={(e) => handleCropMouseDown(e, "move")}
                            style={{
                              left: `${(cropRect.x / imgDims.width) * 100}%`,
                              top: `${(cropRect.y / imgDims.height) * 100}%`,
                              width: `${(cropRect.width / imgDims.width) * 100}%`,
                              height: `${(cropRect.height / imgDims.height) * 100}%`,
                            }}
                            className="absolute border-2 border-brand bg-brand/10 cursor-move shadow-[0_0_0_9999px_rgba(15,23,42,0.42)]"
                          >
                            {/* 4 góc kéo điều chỉnh vùng cắt */}
                            <div
                              onMouseDown={(e) => handleCropMouseDown(e, "nw")}
                              className="absolute -top-1.5 -left-1.5 size-3.5 rounded-xs bg-brand border border-white cursor-nwse-resize"
                            />
                            <div
                              onMouseDown={(e) => handleCropMouseDown(e, "ne")}
                              className="absolute -top-1.5 -right-1.5 size-3.5 rounded-xs bg-brand border border-white cursor-nesw-resize"
                            />
                            <div
                              onMouseDown={(e) => handleCropMouseDown(e, "sw")}
                              className="absolute -bottom-1.5 -left-1.5 size-3.5 rounded-xs bg-brand border border-white cursor-nesw-resize"
                            />
                            <div
                              onMouseDown={(e) => handleCropMouseDown(e, "se")}
                              className="absolute -bottom-1.5 -right-1.5 size-3.5 rounded-xs bg-brand border border-white cursor-nwse-resize"
                            />
                            {/* 4 cạnh kéo điều chỉnh vùng cắt */}
                            <div
                              onMouseDown={(e) => handleCropMouseDown(e, "n")}
                              className="absolute -top-1 left-1/2 -translate-x-1/2 h-2 w-6 rounded-xs bg-brand border border-white cursor-ns-resize"
                            />
                            <div
                              onMouseDown={(e) => handleCropMouseDown(e, "s")}
                              className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-2 w-6 rounded-xs bg-brand border border-white cursor-ns-resize"
                            />
                            <div
                              onMouseDown={(e) => handleCropMouseDown(e, "w")}
                              className="absolute top-1/2 -left-1 -translate-y-1/2 h-6 w-2 rounded-xs bg-brand border border-white cursor-ew-resize"
                            />
                            <div
                              onMouseDown={(e) => handleCropMouseDown(e, "e")}
                              className="absolute top-1/2 -right-1 -translate-y-1/2 h-6 w-2 rounded-xs bg-brand border border-white cursor-ew-resize"
                            />
                            <span className="absolute bottom-1 right-1 rounded bg-slate-900/80 px-1.5 py-0.5 text-[10px] font-mono text-white pointer-events-none">
                              {Math.max(MIN_SIGNATURE_WIDTH, cropRect.width)}×{Math.max(MIN_SIGNATURE_HEIGHT, cropRect.height)}px
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Thanh công cụ Xoay 90° & Cắt ảnh trước khi lưu */}
                    <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleRotate90(1)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-brand hover:text-brand transition shadow-2xs cursor-pointer"
                      >
                        <RotateCw className="size-3.5" />
                        Xoay 90°
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRotate90(-1)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:border-brand hover:text-brand transition shadow-2xs cursor-pointer"
                        title="Xoay ngược chiều kim đồng hồ 90°"
                      >
                        <RotateCcw className="size-3.5" />
                        Xoay -90°
                      </button>

                      <button
                        type="button"
                        onClick={handleToggleCropMode}
                        className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition shadow-2xs cursor-pointer ${
                          isCropMode
                            ? "border-brand bg-brand-soft text-brand"
                            : "border-slate-200 bg-white text-slate-700 hover:border-brand hover:text-brand"
                        }`}
                      >
                        <Crop className="size-3.5" />
                        {isCropMode ? "Đang chọn vùng cắt" : "Cắt ảnh"}
                      </button>

                      <button
                        type="button"
                        onClick={handleTightAutoCrop}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-brand hover:text-brand transition shadow-2xs cursor-pointer"
                      >
                        <Scissors className="size-3.5" />
                        Cắt sát lề
                      </button>

                      {isCropMode && (
                        <button
                          type="button"
                          onClick={handleApplyCrop}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-dark transition shadow-2xs cursor-pointer"
                        >
                          <Check className="size-3.5" />
                          Áp dụng cắt
                        </button>
                      )}

                      {originalUploadUrl && (
                        <button
                          type="button"
                          onClick={handleResetOriginal}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-500 hover:text-slate-800 transition cursor-pointer"
                          title="Khôi phục ảnh gốc ban đầu"
                        >
                          <RefreshCw className="size-3" />
                          Khôi phục
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => inputRef.current?.click()}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-brand font-medium hover:bg-brand-soft/30 transition cursor-pointer"
                      >
                        <ImagePlus className="size-3.5" />
                        Chọn ảnh khác
                      </button>
                    </div>

                    {isCropMode && (
                      <p className="text-[11px] text-slate-500">
                        Kéo khung viền trên ảnh để chọn vùng cắt hoặc nhấn <b>"Cắt sát lề"</b> / <b>"Áp dụng cắt"</b> (kích thước sau cắt luôn đảm bảo ≥ 300×100px).
                      </p>
                    )}
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
                      Định dạng PNG, JPG, JPEG, WEBP (tối thiểu 300×100px, tối đa 2 MB)
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
                      setHasNewUpload(false)
                      setIsCropMode(false)
                      setPreview(user?.signatureSpecimenUrl || null)
                      setError("")
                    }}
                  >
                    Hủy bỏ
                  </Button>
                ) : (
                  <span className="text-xs text-slate-500">
                    {preview
                      ? `Sẵn sàng lưu (${imgDims.width || MIN_SIGNATURE_WIDTH}×${imgDims.height || MIN_SIGNATURE_HEIGHT}px)`
                      : "Chưa chọn file"}
                  </span>
                )}

                <Button
                  variant="primary"
                  disabled={!preview || saving}
                  loading={saving}
                  onClick={handleInitiateSave}
                >
                  <Lock className="size-4 mr-1.5" />
                  {isEditing ? "Cập nhật & Lưu chữ ký" : "Lưu chữ ký"}
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
                {hasExistingSignature ? (
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
                <span className="text-muted block text-[11px]">Ngày đăng ký</span>
                <span className="text-xs text-slate-700 block mt-0.5">
                  {hasExistingSignature && user?.signatureRegisteredAt
                    ? new Date(user.signatureRegisteredAt).toLocaleString("vi-VN")
                    : hasExistingSignature
                      ? "Đã ghi nhận"
                      : "Chưa đăng ký"}
                </span>
              </div>

              {(preview || user?.signatureSpecimenUrl) && (
                <div className="border-t border-slate-100 pt-2.5">
                  <span className="text-muted block text-[11px] mb-1.5">Mô phỏng trong ô ký trên PDF</span>
                  <div className="rounded-lg border border-slate-300 bg-white p-3 text-center shadow-2xs">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                      {isDean ? "Trưởng khoa xác nhận" : level === 2 || role === "class-leader" || role === "class-deputy" ? "Cán bộ lớp xác nhận" : "Sinh viên ký tên"}
                    </p>
                    <div className="my-1.5 flex h-12 items-center justify-center">
                      <img
                        src={preview || user?.signatureSpecimenUrl}
                        alt="Mô phỏng ô ký PDF"
                        className="max-h-11 max-w-[160px] object-contain"
                      />
                    </div>
                    <p className="text-[11px] font-semibold text-slate-800">{ownerName}</p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      {new Date().toLocaleDateString("vi-VN")}
                    </p>
                  </div>
                </div>
              )}

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

      {/* MODAL CẢNH BÁO KHI THAY ĐỔI CHỮ KÝ (UC-AUTH-03 LUỒNG 3a) */}
      <Modal
        open={confirmReplaceModalOpen}
        title="Xác nhận thay đổi chữ ký cá nhân"
        onClose={() => setConfirmReplaceModalOpen(false)}
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button variant="secondary" onClick={() => setConfirmReplaceModalOpen(false)}>
              Hủy
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setConfirmReplaceModalOpen(false)
                setError("")
                setHasNewUpload(false)
                setIsCropMode(false)
                setRotationAngle(0)
                setPreview(user?.signatureSpecimenUrl || null)
                setIsEditing(true)
              }}
            >
              Tôi đã hiểu, tiếp tục thay đổi
            </Button>
          </div>
        }
      >
        <div className="space-y-3 py-2 text-xs text-slate-600">
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3.5 text-amber-900 leading-relaxed flex items-start gap-2.5">
            <AlertCircle className="size-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block mb-1">Lưu ý quan trọng khi thay chữ ký:</span>
              Chữ ký mới chỉ áp dụng cho các lần ký sau. Toàn bộ các phiếu điểm rèn luyện đã ký trước đó vẫn giữ nguyên chữ ký cũ.
            </div>
          </div>
          <p className="text-slate-500">
            Bạn có thể tải lên ảnh chữ ký mới hoặc giữ nguyên ảnh chữ ký hiện tại ở bước tiếp theo.
          </p>
        </div>
      </Modal>

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
