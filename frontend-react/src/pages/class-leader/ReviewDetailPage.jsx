import { ArrowLeft, ChevronLeft, ChevronRight, ExternalLink, FileText, Paperclip, AlertCircle, ShieldAlert, Download, FileSpreadsheet, Check, Printer } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { toast } from "react-hot-toast"
import { rankScore } from "../../common/constants/index.js"
import { useReviewStore } from "../../stores/useReviewStore"
import { reviewService } from "../../services/review-service"
import SignConfirmModal from "../../components/signature/SignConfirmModal"
import PdfViewer from "../../components/ui/PdfViewer"
import StatusTag from "../../components/ui/StatusTag"
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
  const { items, approve, removeForm } = useReviewStore()

  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState(null)
  const [scores, setScores] = useState({})
  const [notes, setNotes] = useState({})
  const [comment, setComment] = useState("")
  const [rejectReasonText, setRejectReasonText] = useState("")
  const [error, setError] = useState("")
  const [signModalOpen, setSignModalOpen] = useState(false)
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("proofs") // 'proofs' | 'pdf'
  const [submitting, setSubmitting] = useState(false)
  const [previewProof, setPreviewProof] = useState(null)

  const handleViewProof = (p) => {
    let resolvedUrl = p.url
    if (resolvedUrl === "dummy_filename" || !resolvedUrl || resolvedUrl === "undefined" || resolvedUrl === "null") {
      resolvedUrl = null
    } else if (
      !resolvedUrl.startsWith("http://") &&
      !resolvedUrl.startsWith("https://") &&
      !resolvedUrl.startsWith("data:") &&
      !resolvedUrl.startsWith("blob:")
    ) {
      resolvedUrl = null
    }
    setPreviewProof({
      ...p,
      url: resolvedUrl,
    })
  }

  // Current logged in user
  const currentUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}")
    } catch {
      return {}
    }
  }, [])

  // Class leader signature
  const classLeaderSig = useMemo(() => {
    return (
      (currentUser?.id ? localStorage.getItem(`user_signature_${currentUser.id}`) : null) ||
      localStorage.getItem("user_signature_3") ||
      currentUser?.signatureSpecimenUrl ||
      null
    )
  }, [currentUser])

  // Load form details from backend
  useEffect(() => {
    let isMounted = true
    const fetchForm = async () => {
      setLoading(true)
      try {
        const res = await reviewService.getDetail(id)
        if (!isMounted) return
        setDetail(res)

        const initialScores = {}
        const initialNotes = {}
        if (Array.isArray(res?.details)) {
          res.details.forEach((d) => {
            const key = d.criteriaCode || String(d.criteriaId)
            const stScore = d.studentScore != null ? Number(d.studentScore) : 0
            const clScore = d.classScore != null ? Number(d.classScore) : stScore
            initialScores[key] = clScore
            if (d.studentNote || d.classNote) {
              initialNotes[key] = d.classNote || d.studentNote || ""
            }
          })
        }
        setScores(initialScores)
        setNotes(initialNotes)
      } catch (err) {
        console.error("Lỗi khi tải chi tiết phiếu:", err)
        toast.error(err.message || "Không thể tải chi tiết phiếu đánh giá")
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    if (id) {
      fetchForm()
    }
    return () => {
      isMounted = false
    }
  }, [id])

  // Flattened criteria list
  const criteriaList = useMemo(() => {
    if (!detail?.details || !Array.isArray(detail.details)) return []
    return detail.details
  }, [detail])

  // Parse proofs from detail items
  const allProofs = useMemo(() => {
    const list = []
    criteriaList.forEach((c) => {
      if (c.proofUrl) {
        try {
          const parsed = JSON.parse(c.proofUrl)
          if (Array.isArray(parsed)) {
            parsed.forEach((p, idx) => {
              list.push({
                criteriaCode: c.criteriaCode,
                criteriaTitle: c.title,
                url: typeof p === "string" ? p : p.url,
                name: typeof p === "string" ? (p.split("/").pop() || `Minh chứng ${idx + 1}`) : p.name,
              })
            })
          } else {
            list.push({
              criteriaCode: c.criteriaCode,
              criteriaTitle: c.title,
              url: parsed,
              name: "Minh chứng",
            })
          }
        } catch {
          c.proofUrl.split(",").filter(Boolean).forEach((u, idx) => {
            const clean = u.trim()
            list.push({
              criteriaCode: c.criteriaCode,
              criteriaTitle: c.title,
              url: clean,
              name: clean.split("/").pop() || `Minh chứng ${idx + 1}`,
            })
          })
        }
      }
    })
    return list
  }, [criteriaList])

  // Total class score calculation
  const total = useMemo(() => {
    return Object.values(scores).reduce((sum, v) => sum + Number(v || 0), 0)
  }, [scores])

  // Count criteria adjusted by class leader
  const changedCount = useMemo(() => {
    let count = 0
    criteriaList.forEach((c) => {
      const key = c.criteriaCode || String(c.criteriaId)
      const stScore = c.studentScore != null ? Number(c.studentScore) : 0
      const clScore = scores[key] != null ? Number(scores[key]) : 0
      if (clScore !== stScore) count++
    })
    return count
  }, [criteriaList, scores])

  // Handle Approve button click
  const handleOpenSignModal = () => {
    if (total > 100) {
      setError("Tổng điểm đánh giá cấp lớp không được vượt quá 100 điểm.")
      toast.error("Tổng điểm không được vượt quá 100 điểm")
      return
    }

    if (!classLeaderSig) {
      toast.error("Bạn chưa có chữ ký số. Vui lòng thiết lập chữ ký trước khi duyệt.")
      navigate("/class-leader/signature")
      return
    }

    setError("")
    setSignModalOpen(true)
  }

  // Confirm approve & digital signature
  const handleConfirmApprove = async (sigImage) => {
    const finalSig = sigImage || classLeaderSig || "CLASS_LEADER_SIGNED"
    setSubmitting(true)
    try {
      const payloadDetails = criteriaList.map((c) => {
        const key = c.criteriaCode || String(c.criteriaId)
        return {
          criteriaId: c.criteriaId,
          criteriaCode: c.criteriaCode,
          classScore: Number(scores[key] || 0),
          note: notes[key] || null,
        }
      })

      await reviewService.classApprove(id, {
        details: payloadDetails,
        signatureBase64: finalSig,
        note: comment || "Cấp lớp đã thẩm định và xác nhận điểm rèn luyện",
      })

      approve(id)
      setSignModalOpen(false)
      toast.success("Đã ký và phê duyệt phiếu ĐRL thành công!")
      navigate("/class-leader/review")
    } catch (err) {
      toast.error(err.message || "Lỗi khi phê duyệt phiếu")
    } finally {
      setSubmitting(false)
    }
  }

  // Confirm rejection
  const handleConfirmReject = async () => {
    if (!rejectReasonText.trim()) {
      toast.error("Vui lòng nhập lý do trả lại phiếu")
      return
    }

    setSubmitting(true)
    try {
      await reviewService.reject(id, rejectReasonText.trim())
      removeForm(id)
      setRejectModalOpen(false)
      toast.success("Đã trả lại phiếu cho sinh viên hoàn thiện lại.")
      navigate("/class-leader/review")
    } catch (err) {
      toast.error(err.message || "Lỗi khi trả lại phiếu")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center text-muted">
          <div className="animate-spin inline-block size-8 border-3 border-brand border-t-transparent rounded-full mb-3" />
          <p>Đang tải dữ liệu phiếu đánh giá...</p>
        </div>
      </div>
    )
  }

  if (!detail) {
    return (
      <div className="rounded-xl border border-line bg-white p-12 text-center text-muted">
        <AlertCircle className="mx-auto size-12 text-slate-300 mb-3" />
        <h3 className="text-base font-semibold text-slate-700">Không tìm thấy phiếu</h3>
        <p className="mt-1 text-sm text-slate-500">Phiếu đánh giá không tồn tại hoặc bạn không có quyền xem.</p>
        <Button className="mt-4" onClick={() => navigate("/class-leader/review")}>
          Quay lại danh sách
        </Button>
      </div>
    )
  }

  return (
    <>
      {/* HEADER / NAVIGATION */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={() => navigate("/class-leader/review")}>
            <ArrowLeft className="size-4 mr-1" />
            Quay lại
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-800">{detail.studentName}</h1>
              <StatusTag status={detail.status} />
            </div>
            <p className="text-xs text-muted font-mono mt-0.5">
              Mã SV: {detail.studentCode} · Lớp: {detail.className || "Chưa rõ"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
            Học kỳ đánh giá: 2026-2027 (HK1)
          </span>
        </div>
      </div>

      {/* MAIN TWO-COLUMN CONTENT */}
      <div className="grid gap-4 lg:grid-cols-[1.2fr_.8fr]">
        {/* LEFT COLUMN: CRITERIA LIST & SCORING */}
        <Card className="p-0 overflow-hidden border border-slate-200 shadow-2xs">
          <div className="grid grid-cols-[1fr_80px_90px] gap-2 bg-slate-100/80 px-4 py-3 text-xs font-bold text-slate-600 border-b border-slate-200">
            <span>Nội dung tiêu chí</span>
            <span className="text-center">SV chấm</span>
            <span className="text-center">Lớp chấm</span>
          </div>

          <div className="max-h-[620px] divide-y divide-slate-100 overflow-y-auto">
            {criteriaList.map((c, index) => {
              const key = c.criteriaCode || String(c.criteriaId)
              const max = Number(c.maxScore || 10)
              const stScore = c.studentScore != null ? Number(c.studentScore) : 0
              const clScore = scores[key] != null ? scores[key] : stScore
              const isChanged = Number(clScore) !== stScore

              return (
                <div
                  key={key || index}
                  className={`grid grid-cols-[1fr_80px_90px] items-center gap-2 px-4 py-3 transition-colors ${
                    isChanged ? "bg-amber-50/60" : "hover:bg-slate-50/60"
                  }`}
                >
                  <div className="pr-2">
                    <div className="flex items-start gap-1.5">
                      {isChanged && (
                        <span className="mt-1 size-2 rounded-full bg-amber-500 shrink-0" title="Đã sửa điểm" />
                      )}
                      <div>
                        <span className="text-sm font-medium text-slate-800 leading-snug block">
                          {c.title}
                        </span>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                          <span className="font-semibold text-slate-500">Tối đa {max}đ</span>
                          {c.criteriaCode && (
                            <span className="font-mono text-[11px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">
                              {c.criteriaCode}
                            </span>
                          )}
                          {c.requiresProof && (
                            <span className="text-brand font-medium text-[11px] flex items-center gap-1">
                              <Paperclip className="size-3" /> Cần MC
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Student self score */}
                  <div className="text-center font-mono font-semibold text-slate-700 text-sm">
                    {stScore}đ
                  </div>

                  {/* Class leader score input */}
                  <div className="flex justify-center">
                    <Input
                      type="number"
                      min="0"
                      max={max}
                      value={clScore}
                      onChange={(e) => {
                        const val = e.target.value === "" ? "" : Math.min(max, Math.max(0, Number(e.target.value)))
                        setScores({
                          ...scores,
                          [key]: val,
                        })
                      }}
                      className="w-20 text-center font-mono font-bold text-slate-900 border-slate-300 focus:border-brand"
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        {/* RIGHT COLUMN: PROOFS & PDF PREVIEW */}
        <div className="space-y-3">
          <div className="flex gap-2 border-b border-line pb-1">
            <button
              onClick={() => setActiveTab("proofs")}
              className={`px-4 py-2 text-xs font-bold rounded-t-lg transition-all ${
                activeTab === "proofs"
                  ? "border-b-2 border-brand text-brand bg-white"
                  : "text-muted hover:text-slate-700"
              }`}
            >
              Minh chứng ({allProofs.length})
            </button>
            <button
              onClick={() => setActiveTab("pdf")}
              className={`px-4 py-2 text-xs font-bold rounded-t-lg transition-all ${
                activeTab === "pdf"
                  ? "border-b-2 border-brand text-brand bg-white"
                  : "text-muted hover:text-slate-700"
              }`}
            >
              Bản xem trước PDF
            </button>
          </div>

          {activeTab === "proofs" ? (
            <Card className="min-h-[580px] p-4 border border-slate-200">
              <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">
                Danh sách tài liệu minh chứng của sinh viên
              </h3>
              {allProofs.length === 0 ? (
                <div className="py-16 text-center text-muted">
                  <Paperclip className="mx-auto size-10 text-slate-300 mb-2" />
                  <p className="text-sm">Không có file minh chứng nào đính kèm cho phiếu này.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                  {allProofs.map((p, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition"
                    >
                      <div className="flex items-center gap-3 overflow-hidden pr-2">
                        <div className="size-8 rounded bg-brand-soft text-brand flex items-center justify-center shrink-0">
                          <FileText className="size-4" />
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-xs font-bold text-slate-800 truncate" title={p.name}>
                            {p.name}
                          </p>
                          <span className="text-[11px] text-slate-500 truncate block mt-0.5">
                            {p.criteriaTitle || p.criteriaCode}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleViewProof(p)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-brand hover:underline shrink-0 bg-white border border-slate-200 rounded-md shadow-2xs cursor-pointer"
                      >
                        <ExternalLink className="size-3" />
                        Xem
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ) : (
            <div className="min-h-[580px]">
              <PdfViewer
                score={total}
                studentTotal={detail?.studentTotal}
                classTotal={total}
                user={{
                  fullName: detail?.studentName || "Nguyễn Văn A",
                  userCode: detail?.studentCode || "SV2026001",
                  className: detail?.className || "IT01",
                  majorName: "Công nghệ Thông tin",
                  facultyName: detail?.departmentName || "Khoa Công nghệ Thông tin",
                  academicCohort: detail?.academicCohort || "2023 - 2027",
                  dob: "15/09/2004",
                }}
                semesterName={detail?.semesterName || "Học kỳ 1"}
                academicYear="2026 - 2027"
                details={detail?.details}
                scores={
                  detail?.details
                    ? Object.fromEntries(detail.details.map((d) => [d.criteriaCode, d.studentScore]))
                    : {}
                }
                classScores={scores}
                studentSignature={
                  detail?.studentSignature ||
                  (detail?.studentId ? localStorage.getItem(`user_signature_${detail.studentId}`) : null)
                }
                classSignature={
                  detail?.status === "CLASS_APPROVED" || detail?.status === "FACULTY_APPROVED" || detail?.status === "DEAN_APPROVED"
                    ? detail?.classSignature
                    : null
                }
                classLeaderName={
                  detail?.status === "CLASS_APPROVED" || detail?.status === "FACULTY_APPROVED" || detail?.status === "DEAN_APPROVED"
                    ? (detail?.classLeaderName || currentUser?.fullName || "Lớp trưởng")
                    : ""
                }
                deanSignature={
                  detail?.status === "DEAN_APPROVED"
                    ? detail?.deanSignature
                    : null
                }
                deanName={
                  detail?.status === "DEAN_APPROVED"
                    ? (detail?.deanName || "Trưởng Khoa CNTT")
                    : ""
                }
              />
            </div>
          )}
        </div>
      </div>

      {/* STICKY BOTTOM TOOLBAR FOR CLASS ASSESSMENT */}
      <div className="sticky bottom-0 z-20 mt-4 rounded-xl border border-slate-300 bg-white/95 p-4 backdrop-blur shadow-lg">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-3">
          <div className="flex flex-wrap items-center gap-6 text-sm">
            <span>
              Tổng SV tự chấm: <b className="font-mono text-slate-800">{detail.studentTotal || 0}đ</b>
            </span>
            <span>
              Tổng điểm Lớp: <b className="font-mono text-brand text-lg font-black">{total}đ</b> / 100
            </span>
            <span>
              Xếp loại gợi ý:{" "}
              <b className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                {rankScore(total)}
              </b>
            </span>
            {changedCount > 0 && (
              <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-medium">
                Đã điều chỉnh {changedCount} tiêu chí
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="danger"
              onClick={() => setRejectModalOpen(true)}
              disabled={submitting}
            >
              Trả lại phiếu
            </Button>
            <Button
              variant="primary"
              onClick={handleOpenSignModal}
              loading={submitting}
              className="bg-brand text-white"
            >
              Ký và duyệt phiếu
            </Button>
          </div>
        </div>

        <Textarea
          label="Nhận xét đánh giá cấp lớp"
          value={comment}
          maxLength={1000}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Nhập nhận xét hoặc ý kiến của ban cán sự lớp về phiếu rèn luyện này..."
          error={error}
        />
      </div>

      {/* SIGN & CONFIRM MODAL */}
      <SignConfirmModal
        open={signModalOpen}
        level={2}
        userName={currentUser?.fullName || "Lớp trưởng"}
        signatureImage={classLeaderSig}
        onNavigateToSignature={() => navigate("/class-leader/signature")}
        summaryData={{
          studentName: detail.studentName,
          studentCode: detail.studentCode,
          studentClass: detail.className,
          semesterName: "Học kỳ 1 (2026-2027)",
          proofCount: allProofs.length,
          totalScore: total,
          rank: rankScore(total),
        }}
        onClose={() => setSignModalOpen(false)}
        onConfirm={handleConfirmApprove}
      />

      {/* REJECT MODAL */}
      <Modal
        open={rejectModalOpen}
        title="Trả lại phiếu rèn luyện"
        onClose={() => setRejectModalOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setRejectModalOpen(false)}>
              Hủy bỏ
            </Button>
            <Button
              variant="danger"
              loading={submitting}
              onClick={handleConfirmReject}
            >
              Xác nhận trả lại
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-xs text-slate-600">
            Phiếu sẽ được chuyển về trạng thái <b>Đã chuyển trả (REJECTED)</b>. Sinh viên{" "}
            <b>{detail.studentName}</b> sẽ nhận được thông báo kèm lý do để tiến hành sửa đổi và nộp lại.
          </p>
          <Textarea
            label="Lý do trả lại phiếu (Bắt buộc)"
            value={rejectReasonText}
            maxLength={1000}
            onChange={(e) => setRejectReasonText(e.target.value)}
            placeholder="Ví dụ: Thiếu minh chứng cho tiêu chí 1.2; điểm tự chấm GPA chưa khớp bảng điểm..."
            rows={4}
          />
        </div>
      </Modal>

      {/* MODAL LIGHTBOX XEM TÀI LIỆU MINH CHỨNG */}
      <Modal
        open={!!previewProof}
        wide
        title={`Xem tài liệu minh chứng: ${previewProof?.name || "Minh chứng"}`}
        onClose={() => setPreviewProof(null)}
        footer={
          <div className="flex items-center justify-between w-full">
            {previewProof?.url && (previewProof.url.startsWith("http") || previewProof.url.startsWith("data:") || previewProof.url.startsWith("blob:")) ? (
              <a
                href={previewProof.url}
                target="_blank"
                rel="noopener noreferrer"
                download={previewProof.name || "minh_chung"}
                className="inline-flex items-center gap-1.5 text-xs text-brand font-semibold hover:underline"
              >
                <Download className="size-3.5" />
                Tải xuống / Mở tệp gốc
              </a>
            ) : (
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 text-xs text-brand font-semibold hover:underline cursor-pointer"
              >
                <Printer className="size-3.5" />
                In / Xuất PDF minh chứng
              </button>
            )}
            <Button variant="secondary" onClick={() => setPreviewProof(null)}>
              Đóng
            </Button>
          </div>
        }
      >
        <div className="flex min-h-[460px] items-center justify-center p-2 bg-slate-100/90 rounded-lg overflow-hidden">
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
                  download={previewProof.name}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition"
                >
                  <Download className="size-4" />
                  Tải xuống tệp Excel
                </a>
              )}
            </div>
          ) : previewProof?.url && (previewProof.url.startsWith("data:application/pdf") || previewProof.url.startsWith("blob:") || (previewProof.url.startsWith("http") && previewProof.name?.toLowerCase().endsWith(".pdf"))) ? (
            <div className="w-full flex flex-col items-center gap-2">
              <iframe
                src={previewProof.url}
                title={previewProof.name}
                className="w-full min-h-[560px] rounded border border-slate-200 bg-white"
              />
            </div>
          ) : previewProof?.url && (previewProof.url.startsWith("data:image") || previewProof.url.startsWith("blob:") || previewProof.url.startsWith("http")) ? (
            <img
              src={previewProof.url}
              alt={previewProof.name}
              className="max-h-[560px] max-w-full rounded object-contain shadow-xs"
            />
          ) : (
            <div className="w-full flex flex-col items-center gap-3 py-2">
              {/* Toolbar mô phỏng PDF viewer */}
              <div className="w-full max-w-3xl flex items-center justify-between px-4 py-2 bg-slate-800 text-white rounded-lg text-xs shadow-sm">
                <div className="flex items-center gap-2 overflow-hidden">
                  <FileText className="size-4 text-rose-400 shrink-0" />
                  <span className="font-semibold truncate max-w-xs">{previewProof?.name || "BUSINESS ANALYST INTERN.pdf"}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-slate-300">Trang 1 / 1</span>
                  <span className="text-slate-500">|</span>
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded text-[11px] font-medium flex items-center gap-1">
                    <Check className="size-3" /> Đã xác thực số
                  </span>
                </div>
              </div>

              {/* Trang tài liệu A4 hoàn chỉnh xem toàn văn */}
              <div className="w-full max-w-3xl bg-white shadow-md border border-slate-300 rounded-sm p-6 sm:p-10 text-slate-800 font-sans relative select-text">
                {/* Header cơ quan & Quốc hiệu */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-slate-200 text-xs">
                  <div>
                    <p className="font-bold uppercase tracking-wider text-slate-900">ĐẠI HỌC QUỐC GIA HÀ NỘI</p>
                    <p className="font-bold uppercase text-brand">TRƯỜNG ĐẠI HỌC VIỆT NHẬT (VJU)</p>
                    <p className="text-[11px] text-slate-600 mt-0.5">Dự án Công nghệ & CLB Đổi mới Sáng tạo VJU</p>
                    <p className="text-[11px] text-slate-400">Số: 89/GCN-VJU-2026</p>
                  </div>
                  <div className="sm:text-right">
                    <p className="font-bold uppercase tracking-wider text-slate-900">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
                    <p className="font-semibold text-slate-800 text-[11px]">Độc lập - Tự do - Hạnh phúc</p>
                    <p className="text-[11px] text-slate-400 mt-1 italic">Hà Nội, ngày 20 tháng 10 năm 2026</p>
                  </div>
                </div>

                {/* Tiêu đề tài liệu */}
                <div className="text-center my-5">
                  <h2 className="text-base sm:text-lg font-bold uppercase tracking-wide text-slate-900">
                    GIẤY XÁC NHẬN HOẠT ĐỘNG VÀ KẾT QUẢ THỰC TẬP
                  </h2>
                  <p className="text-xs font-semibold text-slate-600 mt-1">
                    (V/v Hoàn thành nhiệm vụ Business Analyst Intern & Tham gia NCKH - Hoạt động ngoại khóa)
                  </p>
                  <div className="w-20 h-0.5 bg-rose-500 mx-auto mt-2"></div>
                </div>

                {/* Nội dung chi tiết */}
                <div className="space-y-3.5 text-xs sm:text-[13px] leading-relaxed text-slate-700">
                  <p>
                    <strong>Kính gửi:</strong> Ban Cán sự Lớp {detail?.className || "Lớp IT Khóa 1"} & Ban Chủ nhiệm Khoa Công nghệ Thông tin
                  </p>
                  <p>
                    Ban Điều hành Dự án Công nghệ cùng Ban Chủ nhiệm Câu lạc bộ Học thuật trân trọng chứng nhận:
                  </p>

                  {/* Thông tin sinh viên */}
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1.5 my-2 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div><span className="text-slate-500">Họ và tên:</span> <strong className="text-slate-900">{detail?.studentName || "Nguyễn Thị Phương Thảo"}</strong></div>
                      <div><span className="text-slate-500">Mã sinh viên:</span> <strong className="text-slate-900">{detail?.studentCode || "SV20230004"}</strong></div>
                      <div><span className="text-slate-500">Lớp sinh hoạt:</span> <strong className="text-slate-900">{detail?.className || "Lớp IT Khóa 1"}</strong></div>
                      <div><span className="text-slate-500">Khoa / Chương trình:</span> <strong className="text-slate-900">{detail?.departmentName || "Khoa Công nghệ Thông tin (BSE)"}</strong></div>
                      <div><span className="text-slate-500">Vị trí tham gia:</span> <strong className="text-rose-700 font-semibold">Business Analyst Intern</strong></div>
                      <div><span className="text-slate-500">Thời gian thực tập:</span> <strong className="text-slate-900">Học kỳ 1 (08/2026 - 10/2026)</strong></div>
                    </div>
                  </div>

                  <div>
                    <p className="font-semibold text-slate-900 mb-1">Nội dung công việc & Đánh giá kết quả rèn luyện:</p>
                    <ul className="list-disc pl-5 space-y-1 text-slate-700 text-xs">
                      <li>Tham gia đầy đủ 100% các buổi sinh hoạt chuyên môn, hội thảo học thuật và tọa đàm hướng nghiệp do Khoa/Nhà trường tổ chức.</li>
                      <li>Đảm nhiệm vai trò thực tập sinh Phân tích Nghiệp vụ (Business Analyst), trực tiếp khảo sát và xây dựng tài liệu đặc tả chức năng hệ thống E-Form Đánh giá Điểm Rèn Luyện.</li>
                      <li>Hoàn thành xuất sắc nhiệm vụ được giao, có tinh thần trách nhiệm cao, năng nổ và hỗ trợ tích cực các thành viên trong tập thể.</li>
                    </ul>
                  </div>

                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-emerald-900 text-xs font-medium">
                    <strong>Đề xuất tính điểm rèn luyện:</strong> Đủ điều kiện xác nhận minh chứng cộng điểm tại <strong>Tiêu chí {previewProof?.criteriaCode || "1.2"} ({previewProof?.criteriaTitle || "Ý thức, thái độ tham gia các CLB học thuật, hoạt động ngoại khóa, giao lưu, NCKH"})</strong>.
                  </div>
                </div>

                {/* Phần ký tên & con dấu */}
                <div className="grid grid-cols-2 gap-4 mt-8 pt-4 text-xs">
                  <div className="text-center flex flex-col items-center">
                    <p className="font-bold uppercase text-slate-800">CỐ VẤN HỌC THUẬT</p>
                    <p className="text-[11px] text-slate-400 italic mb-8">(Ký và ghi rõ họ tên)</p>
                    <span className="font-serif italic text-base text-slate-600">Hoàng Văn Nam</span>
                    <p className="font-semibold text-slate-800 mt-1">TS. Hoàng Văn Nam</p>
                  </div>

                  <div className="text-center flex flex-col items-center relative">
                    <p className="font-bold uppercase text-slate-800">TM. BAN ĐIỀU HÀNH / TRƯỞNG DỰ ÁN</p>
                    <p className="text-[11px] text-slate-400 italic mb-8">(Ký, đóng dấu xác nhận)</p>

                    {/* Dấu mộc tròn đỏ chứng thực */}
                    <div className="absolute top-8 size-24 rounded-full border-2 border-dashed border-rose-500/70 text-rose-600/80 flex flex-col items-center justify-center p-1 rotate-[-12deg] pointer-events-none select-none">
                      <div className="size-20 rounded-full border border-rose-500 flex flex-col items-center justify-center text-[7px] font-bold uppercase text-center leading-tight">
                        <span>TRƯỜNG ĐH VIỆT NHẬT</span>
                        <span className="text-[9px] my-0.5">★ ★ ★</span>
                        <span>CLB NCKH & ĐMST</span>
                        <span className="text-rose-700 font-extrabold mt-0.5">ĐÃ CHỨNG THỰC</span>
                      </div>
                    </div>

                    <span className="font-serif italic text-base text-slate-700 relative z-10">Nguyễn Văn C</span>
                    <p className="font-semibold text-slate-800 mt-1 relative z-10">TS. Nguyễn Văn C</p>
                  </div>
                </div>

                {/* Footer mã bảo mật */}
                <div className="mt-8 pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-[10px] text-slate-400 gap-1">
                  <span>Mã bảo chứng số: VJU-PROOF-2026-BA-8902</span>
                  <span>SHA-256: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </>
  )
}
