import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  FileCheck,
  FileSpreadsheet,
  FileText,
  Info,
  Layers,
  Loader2,
  Lock,
  Paperclip,
  PenTool,
  Plus,
  RotateCw,
  Save,
  Send,
  ShieldAlert,
  Upload,
  User,
  X,
} from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import toast from "react-hot-toast"
import { useAuthStore } from "../../stores/useAuthStore"
import { useSubmissionStore } from "../../stores/useSubmissionStore"
import { submissionService } from "../../services/submission-service"
import SignConfirmModal from "../../components/signature/SignConfirmModal"
import PdfViewer from "../../components/ui/PdfViewer"
import { Button, Card, Input, Modal } from "../../components/ui/Primitives"

const formatDescription = (desc) => {
  if (!desc) return ""
  return String(desc)
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\s*\/n\s*/g, "\n")
    .replace(/\/n(?=[+\-•\d\s]|$)/g, "\n")
}

export default function ComposePage() {
  const navigate = useNavigate()
  const { id: routeParamId } = useParams()
  const user = useAuthStore((state) => state.user)

  const {
    scores,
    classScores,
    proofs,
    details,
    semester,
    scoreFormId,
    status,
    rejectReason,
    rejectedBy,
    rejectedAt,
    noActiveSemester,
    isReadOnly,
    isDirty,
    lastSavedText,
    templateLayout,
    rankingScale,
    loading,
    saving,
    submitting,
    fetchFormData,
    setScore,
    addProof,
    removeProof,
    save,
    submit,
    hasSignature,
    classSignature,
    deanSignature,
    classLeaderName,
    deanName,
  } = useSubmissionStore()

  // Modals & States
  const [unsavedModalOpen, setUnsavedModalOpen] = useState(false)
  const [missingSigModalOpen, setMissingSigModalOpen] = useState(false)
  const [signModalOpen, setSignModalOpen] = useState(false)
  const [validationErrors, setValidationErrors] = useState([])
  const [previewProof, setPreviewProof] = useState(null) // { url, name, type }
  const [activeTab, setActiveTab] = useState("FORM") // "FORM" | "PREVIEW"

  // Upload state per criterion: { [fieldCode]: boolean }
  const [uploadingCrit, setUploadingCrit] = useState({})
  const [critUploadError, setCritUploadError] = useState({})

  // File input ref for upload
  const fileInputRef = useRef(null)
  const currentCritTargetRef = useRef(null)

  // Fetch form data on mount or when route param changes
  useEffect(() => {
    fetchFormData(routeParamId).catch((err) => {
      console.warn("fetchFormData error:", err)
    })
  }, [routeParamId])

  // Real-time group calculations according to DRL rules (clamped sum per group)
  const { groupScores, totalScore } = useMemo(() => {
    let grandTotal = 0
    const groups = (templateLayout || []).map((group) => {
      let rawSum = 0
      if (Array.isArray(group.children)) {
        group.children.forEach((crit) => {
          rawSum += Number(scores[crit.fieldCode] || 0)
        })
      }
      const max = Number(group.maxScore || 20)
      const clamped = Math.min(rawSum, max)
      grandTotal += clamped
      return {
        id: group.id,
        rawSum,
        clamped,
        max,
      }
    })

    return {
      groupScores: groups,
      totalScore: Math.min(100, grandTotal),
    }
  }, [templateLayout, scores])

  // Dynamic ranking based on configured rankingScale
  const suggestedRank = useMemo(() => {
    const scale = Array.isArray(rankingScale) && rankingScale.length > 0
      ? rankingScale
      : [
          { rank: "Xuất sắc", minScore: 90, maxScore: 100, color: "text-purple-700 bg-purple-50 border-purple-200" },
          { rank: "Tốt", minScore: 80, maxScore: 89, color: "text-green-700 bg-green-50 border-green-200" },
          { rank: "Khá", minScore: 65, maxScore: 79, color: "text-blue-700 bg-blue-50 border-blue-200" },
          { rank: "Trung bình", minScore: 50, maxScore: 64, color: "text-amber-700 bg-amber-50 border-amber-200" },
          { rank: "Yếu", minScore: 35, maxScore: 49, color: "text-orange-700 bg-orange-50 border-orange-200" },
          { rank: "Kém", minScore: 0, maxScore: 34, color: "text-red-700 bg-red-50 border-red-200" }
        ]

    for (const item of scale) {
      if (totalScore >= Number(item.minScore) && totalScore <= Number(item.maxScore)) {
        return item
      }
    }
    return { rank: "Chưa xếp loại", color: "text-slate-700 bg-slate-100 border-slate-200" }
  }, [rankingScale, totalScore])

  // Toolbar Action 1: Quay lại with Unsaved Changes check
  const handleBackClick = () => {
    if (isDirty) {
      setUnsavedModalOpen(true)
    } else {
      navigate("/student/dashboard")
    }
  }

  // Toolbar Action 2: Lưu nháp (Save draft without validation)
  const handleSaveDraft = async () => {
    try {
      await save()
      toast.success(lastSavedText || "Đã lưu bản nháp thành công!")
    } catch (err) {
      toast.error(err.message || "Lỗi khi lưu bản nháp")
    }
  }

  // Handle Exit after saving draft
  const handleSaveDraftAndExit = async () => {
    try {
      await save()
      toast.success("Đã lưu nháp! Đang quay lại trang chủ...")
      setUnsavedModalOpen(false)
      navigate("/student/dashboard")
    } catch (err) {
      toast.error(err.message || "Lỗi khi lưu nháp")
    }
  }

  // Current active signature image specimen (strictly scoped to current user account)
  const userStorageKey = user?.id ? `user_signature_${user.id}` : null
  const currentSignatureImg =
    user?.signatureSpecimenUrl ||
    (userStorageKey ? localStorage.getItem(userStorageKey) : null)

  // Toolbar Action 3: Đẩy duyệt (Pre-submission validation & signature check)
  const handleSubmitClick = () => {
    const errors = []

    // 1. Validate required criteria and required proofs
    if (Array.isArray(templateLayout)) {
      templateLayout.forEach((group) => {
        if (Array.isArray(group.children)) {
          group.children.forEach((c) => {
            const scoreVal = scores[c.fieldCode]

            // Check if required criterion is completely empty
            if (c.isRequired && (scoreVal === "" || scoreVal == null)) {
              errors.push(`Tiêu chí "${c.title}" là bắt buộc, vui lòng tự chấm điểm.`)
            }

            // Check if criterion requires proof and student score > 0
            const numScore = Number(scoreVal || 0)
            const critProofs = proofs[c.fieldCode] || []
            if (c.requiresProof && numScore > 0 && critProofs.length === 0) {
              errors.push(`Tiêu chí "${c.title}" có điểm (${numScore}đ) nhưng chưa đính kèm minh chứng.`)
            }
          })
        }
      })
    }

    if (totalScore > 100) {
      errors.push("Tổng điểm tự chấm không được vượt quá 100 điểm.")
    }

    if (errors.length > 0) {
      setValidationErrors(errors)
      window.scrollTo({ top: 120, behavior: "smooth" })
      return
    }

    setValidationErrors([])

    // 2. Signature Check: Strictly verify if current student has their own enrolled signature
    if (!currentSignatureImg) {
      setMissingSigModalOpen(true)
      return
    }

    // Open confirmation modal
    setSignModalOpen(true)
  }

  // Confirm sign & submit in background
  const handleConfirmSignAndSubmit = async (signatureData) => {
    try {
      const finalSig =
        (typeof signatureData === "string" && signatureData.startsWith("data:image") ? signatureData : null) ||
        currentSignatureImg ||
        user?.signatureSpecimenUrl ||
        (userStorageKey ? localStorage.getItem(userStorageKey) : null) ||
        localStorage.getItem("user_signature_4") ||
        "DIGITALLY_SIGNED_BY_STUDENT"
      await submit(finalSig)
      setSignModalOpen(false)
      toast.success("Đã ký và gửi duyệt phiếu ĐRL thành công!")
      navigate("/student/pending")
    } catch (err) {
      toast.error(err.message || "Lỗi khi nộp phiếu rèn luyện")
    }
  }

  // Proof Upload Handler
  const handleTriggerUpload = (fieldCode) => {
    if (isReadOnly) return
    const currentList = proofs[fieldCode] || []
    if (currentList.length >= 5) {
      toast.error("Mỗi tiêu chí tối đa được đính kèm 5 file minh chứng.")
      return
    }
    currentCritTargetRef.current = fieldCode
    setCritUploadError((prev) => ({ ...prev, [fieldCode]: null }))
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
      fileInputRef.current.click()
    }
  }

  const handleProcessUploadFiles = async (files, targetField) => {
    if (!files || files.length === 0 || !targetField || isReadOnly) return

    const validExtensions = ["jpg", "jpeg", "png", "webp", "pdf", "xlsx", "xls"]
    const currentList = proofs[targetField] || []
    let availableSlots = 5 - currentList.length

    for (let i = 0; i < files.length; i++) {
      if (availableSlots <= 0) {
        toast.error("Đã đạt giới hạn tối đa 5 file cho tiêu chí này.")
        break
      }

      const file = files[i]
      const ext = file.name.split(".").pop().toLowerCase()

      // Format check (.png, .jpg, .jpeg, .pdf, .xlsx)
      if (!validExtensions.includes(ext)) {
        setCritUploadError((prev) => ({
          ...prev,
          [targetField]: `File "${file.name}" không hợp lệ. Chỉ chấp nhận .png, .jpg, .pdf, .xlsx`,
        }))
        continue
      }

      // Max size check: 10MB
      if (file.size > 10 * 1024 * 1024) {
        setCritUploadError((prev) => ({
          ...prev,
          [targetField]: `File "${file.name}" vượt quá dung lượng tối đa 10 MB.`,
        }))
        continue
      }

      try {
        setUploadingCrit((prev) => ({ ...prev, [targetField]: true }))
        setCritUploadError((prev) => ({ ...prev, [targetField]: null }))

        let fileUrl = ""
        try {
          const res = await submissionService.uploadProof(semester?.id, file)
          fileUrl = typeof res === "string" ? res : res?.url || file.name
        } catch {
          // Fallback object URL if MinIO is not connected
          fileUrl = URL.createObjectURL(file)
        }

        const newProofItem = {
          url: fileUrl,
          name: file.name,
          type: file.type,
          size: file.size,
        }

        addProof(targetField, newProofItem)
        availableSlots--
        toast.success(`Đã đính kèm: ${file.name}`)
      } catch (err) {
        setCritUploadError((prev) => ({
          ...prev,
          [targetField]: `Lỗi tải file "${file.name}": ${err.message}`,
        }))
      } finally {
        setUploadingCrit((prev) => ({ ...prev, [targetField]: false }))
      }
    }
  }

  const handleFileInputChange = (e) => {
    const files = Array.from(e.target.files || [])
    handleProcessUploadFiles(files, currentCritTargetRef.current)
  }

  // Count attached proofs across all criteria
  const totalProofCount = useMemo(() => {
    let count = 0
    Object.values(proofs).forEach((arr) => {
      if (Array.isArray(arr)) count += arr.length
      else if (arr) count += 1
    })
    return count
  }, [proofs])

  // Loading state
  if (loading) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-3">
        <Loader2 className="size-8 animate-spin text-brand" />
        <p className="text-sm font-medium text-slate-600">
          Đang nạp dữ liệu Biểu mẫu ĐRL...
        </p>
      </div>
    )
  }

  // 1. Condition check: Không có kỳ chấm ĐRL đang mở
  if (noActiveSemester) {
    return (
      <div className="mx-auto max-w-xl py-20 px-4 text-center">
        <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 mb-4 shadow-xs">
          <Calendar className="size-8" />
        </div>
        <h2 className="text-lg font-bold text-slate-800">
          Hiện chưa có kỳ chấm ĐRL nào đang mở
        </h2>
        <p className="mt-2 text-sm text-slate-500 leading-relaxed">
          Nhà trường hoặc Khoa hiện chưa kích hoạt đợt đánh giá rèn luyện cho sinh viên.
          Vui lòng quay lại sau khi có thông báo chính thức từ Ban Cố vấn hoặc Văn phòng Khoa.
        </p>
        <div className="mt-6 flex justify-center">
          <Button variant="primary" onClick={() => navigate("/student/dashboard")}>
            <ArrowLeft className="size-4" />
            Về trang chủ sinh viên
          </Button>
        </div>
      </div>
    )
  }

  // Student details info
  const studentFullName = user?.fullName || "Sinh viên"
  const studentCode = user?.userID || user?.userCode || "—"
  const studentClass = user?.className || "—"
  const studentFaculty = user?.facultyName || user?.departmentName || "Khoa"
  const semesterTitle = semester?.semesterName || "Học kỳ đánh giá rèn luyện"

  // Status badge config
  const statusLabels = {
    DRAFT: { text: "Bản nháp", bg: "bg-slate-100 text-slate-700 border-slate-200" },
    REJECTED: { text: "Bị trả lại", bg: "bg-rose-100 text-rose-800 border-rose-200" },
    SUBMITTED: { text: "Đã nộp duyệt", bg: "bg-blue-100 text-blue-800 border-blue-200" },
    CLASS_APPROVED: { text: "Lớp đã thẩm định", bg: "bg-purple-100 text-purple-800 border-purple-200" },
    FACULTY_APPROVED: { text: "Khoa đã duyệt", bg: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  }
  const currentStatusBadge = statusLabels[status] || { text: status, bg: "bg-slate-100 text-slate-700" }

  // Left Pane: Form nhập liệu
  const leftPane = (
    <Card className="p-0 border border-slate-200 shadow-sm overflow-hidden bg-white w-full">
      {/* 1. Header thông tin sinh viên & Học kỳ */}
      <div className="border-b border-slate-200 bg-slate-50/70 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-semibold text-brand">
              Phiếu ĐRL Sinh viên
            </div>
            <h2 className="mt-1.5 text-lg font-bold text-slate-900">
              Phiếu Đánh giá Kết quả Rèn luyện
            </h2>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5 font-medium">
              <Calendar className="size-3.5 text-slate-400" />
              <span>{semesterTitle}</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-muted block mb-0.5">Trạng thái phiếu</span>
            <span className={`inline-block rounded-md border px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${currentStatusBadge.bg}`}>
              {currentStatusBadge.text}
            </span>
          </div>
        </div>

        {/* Student metadata grid */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 rounded-xl border border-slate-200 bg-white p-3 text-sm shadow-xs">
          <div>
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
              Họ và tên
            </span>
            <p className="font-semibold text-slate-800 truncate">{studentFullName}</p>
          </div>
          <div>
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
              Mã sinh viên
            </span>
            <p className="font-semibold text-slate-800 font-mono">{studentCode}</p>
          </div>
          <div>
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
              Lớp sinh hoạt
            </span>
            <p className="font-semibold text-slate-800 truncate">{studentClass}</p>
          </div>
          <div>
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
              Khoa / Bộ môn
            </span>
            <p className="font-semibold text-slate-800 truncate">{studentFaculty}</p>
          </div>
        </div>
      </div>

      {/* 2. KHUNG CẢNH BÁO: PHIẾU BỊ TRẢ LẠI (REJECTED) */}
      {status === "REJECTED" && (
        <div className="m-4 rounded-xl border-2 border-rose-300 bg-rose-50/70 p-4 text-sm text-rose-900 shadow-xs">
          <div className="flex items-center gap-2 font-bold text-rose-800 text-sm">
            <ShieldAlert className="size-5 text-rose-600 shrink-0" />
            <span>Phiếu bị trả lại để chỉnh sửa</span>
          </div>
          <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs border-y border-rose-200/80 py-2">
            <div>
              <span className="text-rose-600 font-medium">Người trả lại: </span>
              <strong className="text-rose-950 font-semibold">{rejectedBy || "Ban cán sự Lớp"}</strong>
            </div>
            <div>
              <span className="text-rose-600 font-medium">Thời điểm: </span>
              <strong className="text-rose-950 font-semibold font-mono">
                {rejectedAt ? new Date(rejectedAt).toLocaleString("vi-VN") : "Gần đây"}
              </strong>
            </div>
          </div>
          <div className="mt-2 text-xs">
            <span className="text-rose-700 font-semibold block mb-1">Lý do trả lại:</span>
            <p className="rounded-lg bg-white/90 border border-rose-200 p-2.5 text-rose-900 leading-relaxed italic">
              "{rejectReason || "Cần bổ sung minh chứng và điều chỉnh điểm tự chấm theo nhận xét của Ban cán sự lớp."}"
            </p>
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-rose-700">
            <span className="size-2 rounded-full bg-rose-500 inline-block shrink-0" />
            <span>Các dòng tiêu chí mà cấp lớp đã chấm khác điểm sinh viên có đánh dấu chấm đỏ nhỏ bên dưới.</span>
          </div>
        </div>
      )}

      {/* 3. Read-Only Notice if in non-editable status */}
      {isReadOnly && (
        <div className="m-4 rounded-lg border border-blue-200 bg-blue-50/70 p-3 text-xs text-blue-800 flex items-center gap-2">
          <Lock className="size-4 text-blue-600 shrink-0" />
          <span>
            Phiếu hiện ở trạng thái <strong>{currentStatusBadge.text}</strong> và được khóa chỉnh sửa. Bạn chỉ có quyền xem nội dung.
          </span>
        </div>
      )}

      {/* 4. Validation error alert banner */}
      {validationErrors.length > 0 && (
        <div className="m-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          <div className="flex items-center gap-2 font-bold">
            <AlertCircle className="size-4 text-rose-600" />
            Vui lòng hoàn thiện các tiêu chí sau trước khi đẩy duyệt:
          </div>
          <ul className="mt-2 list-inside list-disc space-y-1 text-xs">
            {validationErrors.map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Hidden file input for uploading proofs */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        className="hidden"
        multiple
        accept=".png,.jpg,.jpeg,.webp,.pdf,.xlsx,.xls"
      />

      {/* 5. Danh sách các nhóm tiêu chí & Điểm tự chấm */}
      <div className="divide-y divide-slate-200 p-2 sm:p-5 space-y-4">
        {(templateLayout || []).map((group, groupIdx) => {
          const groupCalc = groupScores.find((g) => g.id === group.id) || {
            rawSum: 0,
            clamped: 0,
            max: group.maxScore || 20,
          }

          return (
            <details
              key={group.id || groupIdx}
              open
              className="group rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden"
            >
              <summary className="flex cursor-pointer items-center justify-between bg-slate-50/90 px-4 py-3.5 font-semibold text-slate-900 select-none hover:bg-slate-100/80 transition-colors">
                <div className="pr-4">
                  <div className="text-sm font-bold text-slate-800">
                    {group.title}
                  </div>
                  {group.description && (
                    <p className="mt-0.5 text-xs font-normal text-slate-500 whitespace-pre-line">
                      {formatDescription(group.description)}
                    </p>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  <span className="rounded-full bg-white border border-slate-200 px-3 py-1 font-mono text-xs font-bold text-brand shadow-xs">
                    {groupCalc.clamped} / {groupCalc.max} đ
                  </span>
                </div>
              </summary>

              <div className="divide-y divide-slate-100 p-1">
                {(group.children || []).map((crit) => {
                  const currentScore = scores[crit.fieldCode] ?? ""
                  const critProofList = proofs[crit.fieldCode] || []
                  const isUploading = uploadingCrit[crit.fieldCode]
                  const uploadErr = critUploadError[crit.fieldCode]
                  const isExceeded = Number(currentScore) > crit.maxScore
                  const isNegative = Number(currentScore) < 0

                  // Check if Class graded differently on REJECTED form
                  const classScoreVal = classScores[crit.fieldCode]
                  const isDifferentFromClass =
                    status === "REJECTED" &&
                    classScoreVal != null &&
                    Number(classScoreVal) !== Number(currentScore)

                  return (
                    <div
                      key={crit.id || crit.fieldCode}
                      className={`grid gap-3 p-3.5 transition-colors sm:grid-cols-[1fr_130px] rounded-lg ${
                        isDifferentFromClass ? "bg-rose-50/30 border border-rose-100" : "hover:bg-slate-50/50"
                      }`}
                    >
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Chấm đỏ nhỏ khi lớp chấm khác điểm sinh viên trên phiếu REJECTED */}
                          {isDifferentFromClass && (
                            <span
                              className="size-2.5 rounded-full bg-rose-500 shrink-0 inline-block animate-pulse"
                              title={`Lớp thẩm định: ${classScoreVal}đ (SV chấm: ${currentScore || 0}đ)`}
                            />
                          )}

                          <span className="font-semibold text-slate-800 text-sm">
                            {crit.title}
                          </span>

                          {crit.requiresProof ? (
                            <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 border border-amber-200">
                              <Paperclip className="size-3" />
                              Bắt buộc minh chứng
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400">
                              Không bắt buộc minh chứng
                            </span>
                          )}

                          {isDifferentFromClass && (
                            <span className="rounded bg-rose-100 border border-rose-200 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                              Lớp thẩm định: {classScoreVal}đ
                            </span>
                          )}
                        </div>

                        {crit.description && (
                          <p className="mt-1 whitespace-pre-line text-xs text-slate-500 leading-relaxed">
                            {formatDescription(crit.description)}
                          </p>
                        )}

                        {/* VÙNG MINH CHỨNG: CHỈ HIỂN THỊ KHI TIÊU CHÍ CẦN MINH CHỨNG */}
                        {crit.requiresProof && (
                          <div className="mt-3 space-y-2">
                            {/* Danh sách các file minh chứng đã đính kèm (tối đa 5 file) */}
                            {critProofList.length > 0 && (
                              <div className="flex flex-wrap items-center gap-2">
                                {critProofList.map((item, pIdx) => {
                                  const fileName = item?.name || ""
                                  const isPdf =
                                    item.type === "application/pdf" ||
                                    (typeof item.url === "string" && item.url.toLowerCase().endsWith(".pdf")) ||
                                    fileName.toLowerCase().endsWith(".pdf")
                                  const isExcel =
                                    item.type?.includes("sheet") ||
                                    item.type?.includes("excel") ||
                                    fileName.toLowerCase().endsWith(".xlsx") ||
                                    fileName.toLowerCase().endsWith(".xls")
                                  const isImg = !isPdf && !isExcel

                                  return (
                                    <div
                                      key={pIdx}
                                      className="group relative flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-1.5 pr-2.5 text-xs shadow-2xs hover:border-slate-300 transition"
                                    >
                                      {/* Thumbnail xem trước */}
                                      {isImg ? (
                                        <div
                                          onClick={() => setPreviewProof(item)}
                                          className="size-8 rounded border border-slate-200 overflow-hidden cursor-pointer hover:opacity-80 transition shrink-0 bg-slate-100"
                                          title="Bấm để xem ảnh lớn"
                                        >
                                          <img
                                            src={item.url}
                                            alt={item.name}
                                            className="size-full object-cover"
                                          />
                                        </div>
                                      ) : isExcel ? (
                                        <div
                                          onClick={() => setPreviewProof(item)}
                                          className="size-8 rounded bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 cursor-pointer hover:bg-emerald-100 transition shrink-0"
                                          title="Bấm để xem bảng tính Excel"
                                        >
                                          <FileSpreadsheet className="size-4" />
                                        </div>
                                      ) : (
                                        <div
                                          onClick={() => setPreviewProof(item)}
                                          className="size-8 rounded bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 cursor-pointer hover:bg-rose-100 transition shrink-0"
                                          title="Bấm để xem tài liệu PDF"
                                        >
                                          <FileText className="size-4" />
                                        </div>
                                      )}

                                      <div
                                        onClick={() => setPreviewProof(item)}
                                        className="cursor-pointer min-w-0 max-w-[130px]"
                                      >
                                        <p className="truncate font-medium text-slate-800 text-[11px]" title={item.name}>
                                          {item.name || `Minh chứng ${pIdx + 1}`}
                                        </p>
                                        <span className="text-[9px] text-muted">
                                          {isExcel ? "Bảng tính (.xlsx)" : isPdf ? "Tài liệu PDF" : "Ảnh minh chứng"}
                                        </span>
                                      </div>

                                      {/* Nút xem lớn */}
                                      <button
                                        type="button"
                                        onClick={() => setPreviewProof(item)}
                                        className="text-slate-400 hover:text-brand transition ml-0.5"
                                        title="Xem lớn"
                                      >
                                        <Eye className="size-3.5" />
                                      </button>

                                      {/* Chỉ cho xóa khi DRAFT hoặc REJECTED */}
                                      {!isReadOnly && (status === "DRAFT" || status === "REJECTED") && (
                                        <button
                                          type="button"
                                          onClick={() => removeProof(crit.fieldCode, pIdx)}
                                          className="text-slate-400 hover:text-rose-600 transition ml-1"
                                          title="Xóa minh chứng này"
                                        >
                                          <X className="size-3.5" />
                                        </button>
                                      )}
                                    </div>
                                  )
                                })}
                              </div>
                            )}

                            {/* Nút bấm hoặc Kéo thả thêm minh chứng (Chỉ hiện khi chưa đủ 5 file và chưa bị khóa) */}
                            {!isReadOnly && critProofList.length < 5 && (
                              <div
                                onDragOver={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                }}
                                onDrop={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  const files = Array.from(e.dataTransfer.files || [])
                                  handleProcessUploadFiles(files, crit.fieldCode)
                                }}
                                className="inline-flex items-center gap-2"
                              >
                                <button
                                  type="button"
                                  onClick={() => handleTriggerUpload(crit.fieldCode)}
                                  disabled={isUploading}
                                  className={`inline-flex items-center gap-1.5 rounded-lg border border-dashed px-3 py-1.5 text-xs font-semibold transition ${
                                    Number(currentScore) > 0 && critProofList.length === 0
                                      ? "border-amber-400 bg-amber-50/60 text-amber-800 hover:bg-amber-100"
                                      : "border-slate-300 text-slate-600 hover:border-brand hover:text-brand bg-white"
                                  }`}
                                >
                                  {isUploading ? (
                                    <Loader2 className="size-3.5 animate-spin text-brand" />
                                  ) : (
                                    <Upload className="size-3.5" />
                                  )}
                                  <span>
                                    {isUploading
                                      ? "Đang tải lên..."
                                      : critProofList.length === 0
                                        ? "Đính kèm minh chứng"
                                        : `+ Thêm file (${critProofList.length}/5)`}
                                  </span>
                                </button>
                                <span className="text-[10px] text-muted">
                                  Kéo thả hoặc bấm chọn (.png, .jpg, .pdf, .xlsx - max 10MB)
                                </span>
                              </div>
                            )}

                            {/* Thông báo lỗi upload tại file đó */}
                            {uploadErr && (
                              <div className="flex items-center gap-1 text-[11px] text-rose-600">
                                <AlertCircle className="size-3 shrink-0" />
                                <span>{uploadErr}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Ô nhập điểm tự chấm */}
                      <div className="flex flex-col justify-start">
                        <label className="text-[11px] font-semibold text-slate-600 mb-1">
                          Tối đa <span className="font-mono font-bold text-slate-700">{crit.maxScore}đ</span>
                        </label>
                        <Input
                          type="number"
                          min="0"
                          max={crit.maxScore}
                          step="0.5"
                          disabled={isReadOnly}
                          value={currentScore}
                          onChange={(e) => {
                            const val = e.target.value
                            setScore(crit.fieldCode, val === "" ? "" : Number(val))
                          }}
                          placeholder="0"
                          error={
                            isExceeded
                              ? `Tối đa ${crit.maxScore}đ`
                              : isNegative
                                ? "Không được âm"
                                : ""
                          }
                          className="font-bold text-center text-sm font-mono"
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </details>
          )
        })}
      </div>

      {/* 6. THANH TỔNG HỢP CỐ ĐỊNH PHÍA DƯỚI FORM */}
      <div className="sticky bottom-0 z-10 flex flex-wrap items-center justify-between border-t border-slate-200 bg-white/95 backdrop-blur-xs p-4 shadow-lg">
        <div>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Tổng điểm tự chấm
          </span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-2xl font-black text-brand-dark font-mono">
              {totalScore}
            </span>
            <span className="text-xs font-semibold text-slate-400">/ 100 điểm (Quy chế SUM)</span>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[11px] font-medium text-slate-400 block mb-1">
            Xếp loại gợi ý (tham khảo)
          </span>
          <div className="flex flex-col items-end">
            <span className={`inline-block rounded-full border px-3 py-1 text-xs font-bold ${suggestedRank.color}`}>
              {suggestedRank.rank}
            </span>
            <span className="text-[10px] text-muted block mt-1">
              Chỉ là gợi ý, xếp loại chính thức sau khi Lớp và Khoa duyệt.
            </span>
          </div>
        </div>
      </div>
    </Card>
  )

  return (
    <>
      {/* 1. THANH CÔNG CỤ PHÍA TRÊN (CỐ ĐỊNH KHI CUỘN) */}
      <div className="sticky top-14 z-20 -mx-4 mb-4 flex flex-wrap items-center justify-between gap-3 border-y border-line bg-white px-4 py-3 shadow-xs md:-mx-6 md:px-6">
        <Button onClick={handleBackClick} variant="secondary">
          <ArrowLeft className="size-4" />
          Quay lại
        </Button>

        <div className="flex items-center gap-3">
          {/* Mốc thời gian lưu gần nhất */}
          {lastSavedText && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <Clock className="size-3.5 text-slate-400" />
              <span>{lastSavedText}</span>
            </div>
          )}

          {isDirty && !lastSavedText && (
            <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded font-medium">
              Có thay đổi chưa lưu
            </span>
          )}

          {/* Nút Lưu nháp (chỉ khi được phép sửa) */}
          {!isReadOnly && (
            <Button
              onClick={handleSaveDraft}
              loading={saving}
              variant="secondary"
              title="Lưu lại điểm tự chấm và minh chứng (trạng thái DRAFT)"
            >
              <Save className="size-4" />
              Lưu nháp
            </Button>
          )}

          {/* Nút Đẩy duyệt (Button chính màu đỏ) */}
          {!isReadOnly && (
            <Button
              variant="primary"
              onClick={handleSubmitClick}
              loading={submitting}
              title="Kiểm tra form, ký số và gửi duyệt lên Ban cán sự lớp"
            >
              <Send className="size-4" />
              Đẩy duyệt
            </Button>
          )}

          {/* Nhãn khi ở chế độ chỉ xem */}
          {isReadOnly && (
            <span className="text-xs font-medium text-slate-500 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
              <Lock className="size-3.5 text-slate-400" />
              Chế độ chỉ xem ({currentStatusBadge.text})
            </span>
          )}
        </div>
      </div>

      {/* 2. TAB ĐIỀU HƯỚNG: BẢNG TỰ CHẤM / BẢN XEM TRƯỚC PDF */}
      <div className="mb-4 flex gap-1 border-b border-line bg-white px-2 rounded-t-xl">
        <button
          type="button"
          onClick={() => setActiveTab("FORM")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold transition border-b-2 cursor-pointer ${
            activeTab === "FORM"
              ? "border-brand text-brand shadow-xs"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <PenTool className="size-4" />
          <span>Bảng tự chấm điểm</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("PREVIEW")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold transition border-b-2 cursor-pointer ${
            activeTab === "PREVIEW"
              ? "border-brand text-brand shadow-xs"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <FileText className="size-4" />
          <span>Bản xem trước PDF (Chuẩn Word 2026 - Có chữ ký)</span>
        </button>
      </div>

      {activeTab === "FORM" ? (
        <div className="w-full pb-16">{leftPane}</div>
      ) : (
        <div className="w-full pb-16">
          <PdfViewer
            user={{
              fullName: studentFullName,
              userID: studentCode,
              userCode: studentCode,
              className: studentClass,
              majorName: "Công nghệ Thông tin",
              facultyName: studentFaculty,
              academicCohort: "2023 - 2027",
              signatureSpecimenUrl: currentSignatureImg || user?.signatureSpecimenUrl,
            }}
            semesterName={semesterTitle}
            academicYear="2026 - 2027"
            scores={scores}
            classScores={classScores}
            studentTotal={totalScore}
            studentSignature={currentSignatureImg || user?.signatureSpecimenUrl}
            classSignature={status === "CLASS_APPROVED" || status === "DEAN_APPROVED" || status === "FACULTY_APPROVED" ? classSignature : null}
            classLeaderName={status === "CLASS_APPROVED" || status === "DEAN_APPROVED" || status === "FACULTY_APPROVED" ? (classLeaderName || "Lớp trưởng") : ""}
            deanSignature={status === "DEAN_APPROVED" || status === "FACULTY_APPROVED" ? deanSignature : null}
            deanName={status === "DEAN_APPROVED" || status === "FACULTY_APPROVED" ? (deanName || "Trưởng Khoa CNTT") : ""}
          />
        </div>
      )}

      {/* 3. MODAL 1: BẠN CÓ THAY ĐỔI CHƯA LƯU (KHI BẤM QUAY LẠI) */}
      <Modal
        open={unsavedModalOpen}
        title="Bạn có thay đổi chưa lưu"
        onClose={() => setUnsavedModalOpen(false)}
        footer={
          <div className="flex flex-wrap items-center justify-end gap-2 w-full">
            <Button variant="secondary" onClick={() => setUnsavedModalOpen(false)}>
              Ở lại
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                setUnsavedModalOpen(false)
                navigate("/student/dashboard")
              }}
            >
              Thoát không lưu
            </Button>
            <Button variant="primary" loading={saving} onClick={handleSaveDraftAndExit}>
              Lưu nháp rồi thoát
            </Button>
          </div>
        }
      >
        <div className="space-y-3 py-2 text-sm text-slate-600">
          <p>
            Các điểm số và minh chứng bạn vừa nhập chưa được lưu lại vào hệ thống.
          </p>
          <p className="text-xs text-muted">
            Chọn <strong>Lưu nháp rồi thoát</strong> để bảo toàn toàn bộ dữ liệu đang làm dở, hoặc <strong>Thoát không lưu</strong> nếu muốn bỏ qua các chỉnh sửa này.
          </p>
        </div>
      </Modal>

      {/* 4. MODAL 2: THIẾU ẢNH CHỮ KÝ ĐIỆN TỬ (CHẶN ĐẨY DUYỆT) */}
      <Modal
        open={missingSigModalOpen}
        title="Chưa có ảnh chữ ký điện tử"
        onClose={() => setMissingSigModalOpen(false)}
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="secondary" onClick={() => setMissingSigModalOpen(false)}>
              Đóng
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setMissingSigModalOpen(false)
                navigate("/student/signature")
              }}
            >
              <PenTool className="size-4" />
              Đến trang Chữ ký của tôi
            </Button>
          </div>
        }
      >
        <div className="space-y-3 py-2 text-sm text-slate-600">
          <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
            <AlertTriangle className="size-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-semibold">Quy chuẩn chữ ký số bắt buộc:</strong>
              Để gửi duyệt phiếu rèn luyện lên cấp lớp và khoa, bạn cần đăng ký ảnh chữ ký điện tử chính chủ một lần trên hệ thống.
            </div>
          </div>
          <p className="text-xs text-slate-500">
            Vui lòng đăng ký ảnh mẫu chữ ký tại trang <strong>Chữ ký của tôi</strong>, sau đó quay lại để hoàn tất việc ký và gửi duyệt.
          </p>
        </div>
      </Modal>

      {/* 5. MODAL 3: KÝ VÀ GỬI DUYỆT (CONFIRMATION) */}
      <SignConfirmModal
        open={signModalOpen}
        level={1}
        userName={studentFullName}
        signatureImage={currentSignatureImg}
        summaryData={{
          studentName: studentFullName,
          studentCode: studentCode,
          studentClass: studentClass,
          semesterName: semesterTitle,
          totalScore: totalScore,
          rank: suggestedRank.rank,
          rankColor: suggestedRank.color,
          proofCount: totalProofCount,
        }}
        onClose={() => setSignModalOpen(false)}
        onConfirm={handleConfirmSignAndSubmit}
        onNavigateToSignature={() => {
          setSignModalOpen(false)
          navigate("/student/signature")
        }}
      />

      {/* 6. MODAL 4: LIGHTBOX XEM LỚN MINH CHỨNG (ẢNH HOẶC PDF) */}
      <Modal
        open={!!previewProof}
        wide
        title={`Xem minh chứng: ${previewProof?.name || ""}`}
        onClose={() => setPreviewProof(null)}
        footer={
          <div className="flex items-center justify-between w-full">
            {previewProof?.url && (
              <a
                href={previewProof.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-brand font-semibold hover:underline"
              >
                <ExternalLink className="size-3.5" />
                Mở trong tab mới
              </a>
            )}
            <Button variant="secondary" onClick={() => setPreviewProof(null)}>
              Đóng
            </Button>
          </div>
        }
      >
        <div className="flex min-h-[380px] items-center justify-center p-2 bg-slate-100 rounded-lg overflow-hidden">
          {previewProof?.name?.toLowerCase().endsWith(".xlsx") ||
          previewProof?.name?.toLowerCase().endsWith(".xls") ||
          previewProof?.type?.includes("sheet") ||
          previewProof?.type?.includes("excel") ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <div className="size-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4 shadow-xs">
                <FileSpreadsheet className="size-8" />
              </div>
              <h3 className="font-bold text-slate-800 text-base">{previewProof?.name}</h3>
              <p className="text-xs text-slate-500 mt-1">Bảng tính Microsoft Excel (.xlsx)</p>
              {previewProof?.url && (
                <a
                  href={previewProof.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={previewProof.name}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition"
                >
                  <ExternalLink className="size-4" />
                  Tải xuống / Mở tệp Excel
                </a>
              )}
            </div>
          ) : previewProof?.type === "application/pdf" ||
          (typeof previewProof?.url === "string" && previewProof.url.toLowerCase().endsWith(".pdf")) ? (
            <iframe
              src={previewProof.url}
              title={previewProof.name}
              className="size-full min-h-[480px] rounded border border-slate-200"
            />
          ) : (
            <img
              src={previewProof?.url}
              alt={previewProof?.name}
              className="max-h-[500px] max-w-full rounded object-contain shadow-xs"
            />
          )}
        </div>
      </Modal>
    </>
  )
}
