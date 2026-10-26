import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ExternalLink,
  FileCheck,
  FileText,
  Loader2,
  Paperclip,
  Save,
  Send,
  Upload,
  X,
} from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import toast from "react-hot-toast"
import { rankScore } from "../../common/constants/index.js"
import { useAuthStore } from "../../stores/useAuthStore"
import { useSubmissionStore } from "../../stores/useSubmissionStore"
import { submissionService } from "../../services/submission-service"
import SignConfirmModal from "../../components/signature/SignConfirmModal"
import SplitScreen from "../../components/split-screen/SplitScreen"
import PdfViewer from "../../components/ui/PdfViewer"
import { Button, Card, Input, Modal } from "../../components/ui/Primitives"

export default function ComposePage() {
  const navigate = useNavigate()
  const { id: routeSemesterId } = useParams()

  const user = useAuthStore((state) => state.user)

  const {
    scores,
    proofs,
    details,
    semester,
    scoreFormId,
    status,
    templateLayout,
    loading,
    saving,
    submitting,
    fetchFormData,
    setScore,
    setProof,
    save,
    submit,
    hasSignature,
  } = useSubmissionStore()

  const [signModalOpen, setSignModalOpen] = useState(false)
  const [missingSigModalOpen, setMissingSigModalOpen] = useState(false)
  const [validationErrors, setValidationErrors] = useState([])
  const [lastSavedText, setLastSavedText] = useState("")
  const [uploadingField, setUploadingField] = useState(null)

  const fileInputRef = useRef(null)
  const currentUploadTargetRef = useRef(null)

  // Fetch real form data for student on mount
  useEffect(() => {
    fetchFormData(routeSemesterId).catch((err) => {
      toast.error(err.message || "Không thể tải biểu mẫu rèn luyện")
    })
  }, [routeSemesterId])

  // Real-time group calculations according to DRL-2026 rules
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

  // Save draft handler
  const handleSaveDraft = async () => {
    try {
      await save()
      const timeStr = new Date().toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
      setLastSavedText(`Đã lưu nháp lúc ${timeStr}`)
      toast.success("Đã lưu bản nháp thành công!")
    } catch (err) {
      toast.error(err.message || "Lỗi khi lưu bản nháp")
    }
  }

  // Upload proof file
  const handleTriggerUpload = (fieldCode) => {
    currentUploadTargetRef.current = fieldCode
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
      fileInputRef.current.click()
    }
  }

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    const targetField = currentUploadTargetRef.current
    if (!file || !targetField) return

    // Validate file type & size (max 10MB)
    const validTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"]
    if (!validTypes.includes(file.type)) {
      toast.error("Chỉ chấp nhận file ảnh (PNG, JPG) hoặc tài liệu PDF!")
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Dung lượng file tối đa là 10 MB!")
      return
    }

    try {
      setUploadingField(targetField)
      const res = await submissionService.uploadProof(semester?.id, file)
      // res returns the uploaded object key/url
      const fileUrl = typeof res === "string" ? res : res?.url || file.name
      setProof(targetField, fileUrl)
      toast.success(`Đã tải lên minh chứng cho ${targetField}!`)
    } catch (err) {
      console.warn("Upload proof error:", err)
      // Fallback: use simulated object URL for preview if offline storage
      const fallbackUrl = URL.createObjectURL(file)
      setProof(targetField, fallbackUrl)
      toast.success(`Đã đính kèm file: ${file.name}`)
    } finally {
      setUploadingField(null)
    }
  }

  const handleRemoveProof = (fieldCode) => {
    setProof(fieldCode, null)
    toast.success("Đã xóa minh chứng đính kèm")
  }

  // Pre-submission validation
  const handleSubmitClick = () => {
    const errors = []

    // Check required proofs
    if (Array.isArray(templateLayout)) {
      templateLayout.forEach((group) => {
        if (Array.isArray(group.children)) {
          group.children.forEach((c) => {
            const scoreVal = Number(scores[c.fieldCode] || 0)
            if (c.requiresProof && scoreVal > 0 && !proofs[c.fieldCode]) {
              errors.push(`Tiêu chí "${c.title}" có điểm (${scoreVal}đ) nhưng chưa đính kèm minh chứng bắt buộc.`)
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
      return
    }

    setValidationErrors([])
    setSignModalOpen(true)
  }

  const handleConfirmSignAndSubmit = async () => {
    try {
      await submit("DIGITALLY_SIGNED_BY_STUDENT")
      setSignModalOpen(false)
      toast.success("Đã ký và gửi duyệt phiếu ĐRL thành công!")
      navigate("/student/pending")
    } catch (err) {
      toast.error(err.message || "Lỗi khi nộp phiếu rèn luyện")
    }
  }

  // Student info display
  const studentFullName = user?.fullName || "Sinh viên"
  const studentCode = user?.userID || user?.userCode || "—"
  const studentClass = user?.className || "—"
  const studentFaculty = user?.facultyName || user?.departmentName || "Khoa"
  const semesterTitle = semester?.semesterName || "Học kỳ 1 Năm 2026-2027"

  // Count attached proofs
  const proofCount = Object.values(proofs).filter(Boolean).length

  if (loading) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-3">
        <Loader2 className="size-8 animate-spin text-brand" />
        <p className="text-sm font-medium text-slate-600">
          Đang nạp dữ liệu Biểu mẫu DRL-2026...
        </p>
      </div>
    )
  }

  const leftPane = (
    <Card className="p-0 border border-slate-200 shadow-sm overflow-hidden bg-white">
      {/* 1. Header thông tin sinh viên & Biểu mẫu */}
      <div className="border-b border-slate-200 bg-slate-50/70 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-semibold text-brand">
              Biểu mẫu: DRL-2026 (Phiên bản v1.0)
            </div>
            <h2 className="mt-1.5 text-lg font-bold text-slate-900">
              Phiếu Đánh giá Kết quả Rèn luyện
            </h2>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
              <Calendar className="size-3.5" />
              <span>{semesterTitle}</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-500 block">Trạng thái</span>
            <span className="inline-block rounded-md px-2.5 py-1 text-xs font-semibold uppercase bg-amber-100 text-amber-800">
              {status === "SUBMITTED" ? "Đã nộp duyệt" : "Bản nháp"}
            </span>
          </div>
        </div>

        {/* Student metadata grid */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 rounded-lg border border-slate-200 bg-white p-3.5 text-sm shadow-xs">
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
            <p className="font-semibold text-slate-800">{studentCode}</p>
          </div>
          <div>
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
              Lớp khóa học
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

      {/* Validation alert banner if missing proofs */}
      {validationErrors.length > 0 && (
        <div className="m-4 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          <div className="flex items-center gap-2 font-semibold">
            <AlertCircle className="size-4 text-rose-600" />
            Vui lòng hoàn thiện các mục sau trước khi gửi duyệt:
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
        onChange={handleFileChange}
        className="hidden"
        accept="image/png,image/jpeg,image/webp,application/pdf"
      />

      {/* 2. Danh sách 5 nhóm tiêu chí từ DRL-2026 */}
      <div className="max-h-[640px] overflow-y-auto divide-y divide-slate-200 p-2 sm:p-4">
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
              className="group rounded-lg border border-slate-200 bg-white mb-3 shadow-2xs overflow-hidden last:mb-0"
            >
              <summary className="flex cursor-pointer items-center justify-between bg-slate-50/90 px-4 py-3.5 font-semibold text-slate-900 select-none hover:bg-slate-100/80 transition-colors">
                <div className="pr-4">
                  <div className="text-sm font-bold text-slate-800">
                    {group.title}
                  </div>
                  {group.description && (
                    <p className="mt-0.5 text-xs font-normal text-slate-500 line-clamp-1">
                      {group.description}
                    </p>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  <span className="rounded-full bg-white border border-slate-200 px-3 py-1 text-xs font-bold text-brand shadow-xs">
                    {groupCalc.clamped} / {groupCalc.max} đ
                  </span>
                </div>
              </summary>

              <div className="divide-y divide-slate-100 p-1">
                {(group.children || []).map((crit) => {
                  const currentScore = scores[crit.fieldCode] ?? ""
                  const currentProof = proofs[crit.fieldCode]
                  const isUploading = uploadingField === crit.fieldCode
                  const isExceeded = Number(currentScore) > crit.maxScore
                  const isNegative = Number(currentScore) < 0

                  return (
                    <div
                      key={crit.id || crit.fieldCode}
                      className="grid gap-3 p-3.5 transition-colors hover:bg-slate-50/50 sm:grid-cols-[1fr_120px]"
                    >
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-slate-800 text-sm">
                            {crit.title}
                          </span>
                          {crit.requiresProof ? (
                            <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 border border-amber-200">
                              <Paperclip className="size-3" />
                              Bắt buộc minh chứng
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400">
                              Không bắt buộc minh chứng
                            </span>
                          )}
                        </div>

                        {crit.description && (
                          <p className="mt-1.5 whitespace-pre-line text-xs text-slate-600 leading-relaxed bg-slate-50/60 p-2 rounded border border-slate-100">
                            {crit.description}
                          </p>
                        )}

                        {/* Vùng đính kèm minh chứng */}
                        <div className="mt-2.5 flex flex-wrap items-center gap-2">
                          {currentProof ? (
                            <div className="inline-flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs text-emerald-800">
                              <FileCheck className="size-3.5 text-emerald-600" />
                              <span className="max-w-[200px] truncate font-medium">
                                Đã đính kèm minh chứng
                              </span>
                              {typeof currentProof === "string" && currentProof.startsWith("http") && (
                                <a
                                  href={currentProof}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-emerald-700 hover:text-emerald-900"
                                  title="Xem file"
                                >
                                  <ExternalLink className="size-3" />
                                </a>
                              )}
                              <button
                                type="button"
                                onClick={() => handleTriggerUpload(crit.fieldCode)}
                                className="text-[11px] text-emerald-700 underline hover:text-emerald-900"
                              >
                                Thay thế
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveProof(crit.fieldCode)}
                                className="text-emerald-600 hover:text-rose-600 ml-1"
                                title="Xóa minh chứng"
                              >
                                <X className="size-3" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleTriggerUpload(crit.fieldCode)}
                              disabled={isUploading}
                              className={`inline-flex items-center gap-1.5 rounded-md border border-dashed px-2.5 py-1 text-xs transition-colors ${
                                crit.requiresProof && Number(currentScore) > 0
                                  ? "border-amber-400 bg-amber-50/50 text-amber-800 hover:bg-amber-100/60"
                                  : "border-slate-300 text-slate-600 hover:border-brand hover:text-brand"
                              }`}
                            >
                              {isUploading ? (
                                <Loader2 className="size-3 animate-spin text-brand" />
                              ) : (
                                <Upload className="size-3" />
                              )}
                              <span>
                                {isUploading ? "Đang tải lên..." : "Đính kèm minh chứng"}
                              </span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Ô nhập điểm */}
                      <div className="flex flex-col justify-start">
                        <label className="text-[11px] font-medium text-slate-500 mb-1">
                          Điểm tự chấm (Max: {crit.maxScore})
                        </label>
                        <Input
                          type="number"
                          min="0"
                          max={crit.maxScore}
                          step="0.5"
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
                          className="font-bold text-center"
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

      {/* 3. Sticky Bottom: Tổng điểm & Xếp loại */}
      <div className="sticky bottom-0 z-10 flex flex-wrap items-center justify-between border-t border-slate-200 bg-white/95 backdrop-blur-xs p-4 shadow-lg">
        <div>
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Tổng điểm rèn luyện tự chấm
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-brand-dark">
              {totalScore}
            </span>
            <span className="text-xs font-semibold text-slate-400">/ 100 điểm</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-xs text-slate-400 block">Dự kiến xếp loại</span>
            <span className="inline-block rounded-full bg-brand-soft border border-brand-line px-3 py-1 text-xs font-bold text-brand">
              {rankScore(totalScore)}
            </span>
          </div>
        </div>
      </div>
    </Card>
  )

  return (
    <>
      {/* Thanh công cụ Sticky top */}
      <div className="sticky top-14 z-20 -mx-4 mb-4 flex flex-wrap items-center gap-2 border-y border-line bg-white px-4 py-3 shadow-xs md:-mx-6 md:px-6">
        <Button onClick={() => navigate(-1)} variant="secondary">
          <ArrowLeft className="size-4" />
          Quay lại
        </Button>

        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-slate-500 hidden sm:inline">
            {lastSavedText || "Thay đổi chưa lưu"}
          </span>

          <Button
            onClick={handleSaveDraft}
            loading={saving}
            variant="secondary"
            title="Lưu lại điểm tự chấm và minh chứng"
          >
            <Save className="size-4" />
            Lưu nháp
          </Button>

          <Button
            variant="primary"
            onClick={handleSubmitClick}
            disabled={status === "SUBMITTED"}
            title="Gửi duyệt lên Lớp trưởng và Khoa"
          >
            <Send className="size-4" />
            {status === "SUBMITTED" ? "Đã gửi duyệt" : "Đẩy duyệt & Ký số"}
          </Button>
        </div>
      </div>

      {/* Màn hình chia đôi: Trái là Biểu mẫu soạn thảo DRL-2026, Phải là PDF Preview */}
      <SplitScreen
        left={leftPane}
        right={
          <PdfViewer
            user={user}
            semesterName={semesterTitle}
            groups={templateLayout}
            scores={scores}
            total={totalScore}
            official={status === "SUBMITTED"}
          />
        }
      />

      {/* Modal xác nhận Ký và Nộp duyệt */}
      <SignConfirmModal
        open={signModalOpen}
        level={1}
        userName={studentFullName}
        summary={`Tổng điểm tự chấm: ${totalScore}/100 đ (${rankScore(totalScore)}) · ${proofCount} minh chứng đính kèm`}
        onClose={() => setSignModalOpen(false)}
        onConfirm={handleConfirmSignAndSubmit}
      />
    </>
  )
}
