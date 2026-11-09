import { ArrowLeft, CheckSquare, FileText, CheckCircle2, RotateCcw, AlertTriangle } from "lucide-react"
import { useState, useEffect, useMemo } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { toast } from "react-hot-toast"
import { useAuthStore } from "../../stores/useAuthStore"
import { reviewService } from "../../services/review-service"
import { client } from "../../lib/axios/client"
import BatchSignProgress from "../../components/signature/BatchSignProgress"
import SignConfirmModal from "../../components/signature/SignConfirmModal"
import PdfViewer from "../../components/ui/PdfViewer"
import { Button, Card, Modal, Textarea } from "../../components/ui/Primitives"

export default function BatchDetailPage() {
  const navigate = useNavigate()
  const { classId } = useParams()
  const user = useAuthStore((s) => s.user)

  const [forms, setForms] = useState([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [activeDetail, setActiveDetail] = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [classNameInfo, setClassNameInfo] = useState("")
  const [sign, setSign] = useState(false)
  const [progress, setProgress] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Modal trả lại phiếu (Reject)
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState("")

  // Dean signature specimen
  const deanSig = useMemo(() => {
    if (!user) return null
    return (
      localStorage.getItem(`user_signature_${user.id}`) ||
      user.signatureSpecimenUrl ||
      null
    )
  }, [user])

  // Load forms for this class or pending queue
  const fetchForms = async () => {
    setLoading(true)
    try {
      const res = await reviewService.list(0, 200)
      const list = Array.isArray(res) ? res : []

      // Lọc theo classId nếu không phải 'all'
      let filtered = list
      if (classId && classId !== "all") {
        filtered = list.filter((f) => {
          const rawClassId = f.raw?.student?.classEntity?.id
          const rawClassCode = f.raw?.student?.classEntity?.classCode
          return (
            String(rawClassId) === String(classId) ||
            String(rawClassCode).toLowerCase() === String(classId).toLowerCase() ||
            String(f.className).toLowerCase() === String(classId).toLowerCase()
          )
        })
        // Nếu không tìm thấy theo id, giữ nguyên danh sách nếu classId không hợp lệ
        if (filtered.length === 0 && list.length > 0) {
          filtered = list
        }
      }

      setForms(filtered)
      if (filtered.length > 0) {
        setSelected(filtered.map((_, i) => i))
        setClassNameInfo(filtered[0]?.className || "")
      }
    } catch (err) {
      console.error("Lỗi khi tải danh sách phiếu lô:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchForms()
  }, [classId])

  // Load detail of currently focused form
  const currentForm = forms[selectedIndex] || null

  useEffect(() => {
    let isMounted = true
    if (!currentForm?.id) {
      setActiveDetail(null)
      return
    }

    const fetchDetail = async () => {
      setLoadingDetail(true)
      try {
        const res = await reviewService.getDetail(currentForm.id)
        if (isMounted) setActiveDetail(res)
      } catch (err) {
        console.error("Lỗi khi tải chi tiết phiếu:", err)
      } finally {
        if (isMounted) setLoadingDetail(false)
      }
    }

    fetchDetail()
    return () => {
      isMounted = false
    }
  }, [currentForm?.id])

  const handleOpenSignModal = () => {
    if (selected.length === 0) {
      toast.error("Vui lòng chọn ít nhất 1 phiếu để ký duyệt.")
      return
    }

    if (!deanSig) {
      toast.error("Bạn chưa có chữ ký số. Vui lòng tải lên chữ ký trước khi duyệt.")
      navigate("/dean/signature")
      return
    }

    setSign(true)
  }

  const handleConfirmBatchSign = async () => {
    setSign(false)
    setSubmitting(true)
    const selectedIds = selected.map((idx) => forms[idx]?.id).filter(Boolean)

    try {
      if (selectedIds.length > 0) {
        await client.post("/workflow/dean/approve-batch", {
          ids: selectedIds.map(Number),
          signatureBase64: deanSig,
        })
      }
      setProgress(true)
      toast.success(`Đã ký và phê duyệt thành công ${selectedIds.length} phiếu!`)
    } catch (err) {
      toast.error(err.message || "Lỗi khi ký duyệt lô")
    } finally {
      setSubmitting(false)
    }
  }

  // Trưởng khoa trả lại phiếu (Reject)
  const handleConfirmReject = async () => {
    if (!currentForm?.id) return
    if (!rejectReason.trim()) {
      toast.error("Vui lòng nhập lý do trả lại phiếu")
      return
    }

    setSubmitting(true)
    try {
      await reviewService.reject(currentForm.id, rejectReason.trim())
      toast.success(`Đã trả lại phiếu của sinh viên ${currentForm.name} thành công.`)
      setRejectModalOpen(false)
      setRejectReason("")

      // Loại bỏ phiếu vừa trả lại khỏi danh sách hiện tại
      const nextForms = forms.filter((f) => f.id !== currentForm.id)
      setForms(nextForms)
      setSelected(nextForms.map((_, i) => i))
      if (selectedIndex >= nextForms.length) {
        setSelectedIndex(Math.max(0, nextForms.length - 1))
      }
    } catch (err) {
      toast.error(err.message || "Lỗi khi trả lại phiếu")
    } finally {
      setSubmitting(false)
    }
  }

  const displayTitle = classId === "all"
    ? "Toàn bộ phiếu chờ ký cấp Khoa"
    : classNameInfo
      ? `Lô lớp: ${classNameInfo}`
      : `Lô lớp #${classId || "CNTT"}`

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Button variant="secondary" onClick={() => navigate("/dean/batches")}>
          <ArrowLeft className="size-4 mr-1" />
          Quay lại danh sách lô
        </Button>
        <div className="ml-2">
          <h1 className="text-lg font-semibold text-slate-800">{displayTitle}</h1>
          <p className="text-xs text-muted">
            {forms.length > 0
              ? `${forms.length} phiếu sẵn sàng phê duyệt cấp Khoa`
              : "Hiện không có phiếu nào chờ duyệt"}
          </p>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {currentForm && (
            <Button
              variant="secondary"
              onClick={() => {
                setRejectReason(`Yêu cầu xem xét lại điểm hoặc bổ sung minh chứng cho phiếu ĐRL của ${currentForm.name}.`)
                setRejectModalOpen(true)
              }}
              disabled={submitting}
              className="text-rose-600 border-rose-200 hover:bg-rose-50"
            >
              <RotateCcw className="size-3.5 mr-1" />
              Trả lại phiếu này
            </Button>
          )}

          <Button
            variant="primary"
            className="bg-brand text-white"
            onClick={handleOpenSignModal}
            disabled={selected.length === 0 || submitting}
            loading={submitting}
          >
            Ký duyệt lô ({selected.length} phiếu)
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.05fr_.95fr]">
        <Card className="p-0 border border-slate-200">
          <div className="flex items-center justify-between border-b border-line p-4 bg-slate-50/50">
            <b>Danh sách phiếu ({forms.length})</b>
            <label className="text-xs flex items-center gap-1.5 cursor-pointer font-medium text-slate-600">
              <input
                type="checkbox"
                checked={forms.length > 0 && selected.length === forms.length}
                onChange={(e) =>
                  setSelected(e.target.checked ? forms.map((_, i) => i) : [])
                }
                className="accent-brand"
              />
              Chọn tất cả ({selected.length}/{forms.length})
            </label>
          </div>

          {forms.length === 0 ? (
            <div className="p-12 text-center text-muted">
              <CheckCircle2 className="mx-auto size-12 text-emerald-500 mb-2" />
              <h3 className="text-sm font-semibold text-slate-700">Tất cả phiếu đã được xử lý</h3>
              <p className="text-xs text-slate-400 mt-1">Lô lớp này không còn phiếu nào đang chờ Trưởng khoa ký duyệt.</p>
              <Button className="mt-4" onClick={() => navigate("/dean/batches")}>
                Quay lại danh sách lô
              </Button>
            </div>
          ) : (
            <div className="max-h-[650px] overflow-auto divide-y divide-line">
              {forms.map((item, i) => {
                const isSelected = selected.includes(i)
                const isActive = selectedIndex === i
                return (
                  <div
                    key={item.id || i}
                    onClick={() => setSelectedIndex(i)}
                    className={`flex items-center justify-between p-3.5 cursor-pointer transition ${
                      isActive ? "bg-brand-soft/30 border-l-4 border-l-brand" : "hover:bg-canvas"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onClick={(e) => e.stopPropagation()}
                        onChange={() =>
                          setSelected(
                            isSelected
                              ? selected.filter((x) => x !== i)
                              : [...selected, i]
                          )
                        }
                        className="accent-brand"
                      />
                      <div>
                        <b className="text-sm text-slate-800 block">{item.name}</b>
                        <small className="text-xs text-muted font-mono">{item.code} · {item.className || classNameInfo}</small>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-bold text-sm text-brand block">
                        {item.classScore != null ? `${item.classScore}đ` : `${item.score}đ`}
                      </span>
                      <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block mt-0.5">
                        Lớp đã thông qua
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        {/* PHẦN XEM TRƯỚC BẢN IN PDF */}
        <div>
          <div className="mb-3 flex items-center justify-between border-b border-line pb-2">
            <span className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <FileText className="size-4 text-brand" />
              Bản xem trước biểu mẫu (Chuẩn chữ ký số)
            </span>
            {currentForm && (
              <span className="text-xs text-muted">
                Đang xem: <b>{currentForm.name}</b> ({currentForm.code})
              </span>
            )}
          </div>

          {loadingDetail ? (
            <div className="p-16 text-center text-muted">
              <div className="animate-spin inline-block size-8 border-3 border-brand border-t-transparent rounded-full mb-3" />
              <p className="text-xs">Đang tải biểu mẫu chi tiết...</p>
            </div>
          ) : (
            <PdfViewer
              user={{
                fullName: activeDetail?.studentName || currentForm?.name || "Sinh viên",
                userID: activeDetail?.studentCode || currentForm?.code || "SV2026",
                userCode: activeDetail?.studentCode || currentForm?.code || "SV2026",
                className: activeDetail?.className || currentForm?.className || classNameInfo || "",
                majorName: "Công nghệ Thông tin",
                facultyName: activeDetail?.departmentName || "Khoa Công nghệ Thông tin",
                academicCohort: activeDetail?.academicCohort || "2023 - 2027",
              }}
              semesterName={activeDetail?.semesterName || "Học kỳ 1"}
              academicYear="2026 - 2027"
              scores={
                activeDetail?.details
                  ? Object.fromEntries(activeDetail.details.map((d) => [d.criteriaCode, d.studentScore]))
                  : {}
              }
              classScores={
                activeDetail?.details
                  ? Object.fromEntries(activeDetail.details.map((d) => [d.criteriaCode, d.classScore]))
                  : {}
              }
              studentTotal={activeDetail?.studentTotal ?? currentForm?.score ?? 80}
              classTotal={activeDetail?.classTotal ?? currentForm?.classScore ?? 80}
              studentSignature={activeDetail?.studentSignature}
              classSignature={activeDetail?.classSignature}
              classLeaderName={activeDetail?.classLeaderName || "Lớp trưởng"}
              deanSignature={activeDetail?.deanSignature || deanSig}
              deanName={activeDetail?.deanName || user?.fullName || "Trưởng Khoa CNTT"}
            />
          )}
        </div>
      </div>

      {/* MODAL TRẢ LẠI PHIẾU CỦA TRƯỞNG KHOA */}
      <Modal
        open={rejectModalOpen}
        title={`Trả lại phiếu: ${currentForm?.name || ""}`}
        onClose={() => setRejectModalOpen(false)}
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="secondary" onClick={() => setRejectModalOpen(false)} disabled={submitting}>
              Hủy
            </Button>
            <Button
              variant="danger"
              onClick={handleConfirmReject}
              loading={submitting}
              className="bg-rose-600 text-white"
            >
              Xác nhận trả lại
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-lg bg-rose-50 p-3 text-rose-800 border border-rose-200">
            <AlertTriangle className="size-5 shrink-0 text-rose-600 mt-0.5" />
            <div className="text-xs leading-relaxed">
              <p className="font-semibold text-rose-900">Xác nhận chuyển trả phiếu về cấp trước</p>
              <p className="mt-0.5 text-rose-700">
                Phiếu của sinh viên <strong>{currentForm?.name}</strong> sẽ được chuyển về trạng thái <strong>TRẢ LẠI (REJECTED)</strong>.
                Sinh viên và Cán bộ lớp sẽ nhận được thông báo kèm lý do cụ thể để hoàn thiện lại.
              </p>
            </div>
          </div>

          <Textarea
            label="Lý do trả lại phiếu (Bắt buộc)"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Nhập lý do chi tiết (ví dụ: Thiếu minh chứng cho tiêu chí 1.2, điểm tự chấm chưa phù hợp...)"
            rows={4}
            maxLength={1000}
          />
        </div>
      </Modal>

      <SignConfirmModal
        open={sign}
        level={3}
        userName={user?.fullName || "Trưởng Khoa"}
        signatureImage={deanSig}
        onNavigateToSignature={() => navigate("/dean/signature")}
        summary={`${selected.length} phiếu thuộc ${displayTitle}`}
        onClose={() => setSign(false)}
        onConfirm={handleConfirmBatchSign}
      />

      <Modal open={progress} title="Tiến trình ký duyệt lô" wide onClose={() => {}}>
        <BatchSignProgress
          count={selected.length}
          onClose={() => {
            setProgress(false)
            navigate("/dean/batches")
          }}
        />
      </Modal>
    </>
  )
}
