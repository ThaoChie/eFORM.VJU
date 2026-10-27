import { ArrowLeft, ChevronLeft, ChevronRight, ExternalLink, FileText, Paperclip, AlertCircle, ShieldAlert } from "lucide-react"
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
                      <a
                        href={p.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-brand hover:underline shrink-0 bg-white border border-slate-200 rounded-md shadow-2xs"
                      >
                        <ExternalLink className="size-3" />
                        Xem
                      </a>
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
    </>
  )
}
