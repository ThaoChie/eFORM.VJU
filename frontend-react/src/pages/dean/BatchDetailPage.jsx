import { ArrowLeft, CheckSquare, FileText, CheckCircle2, RotateCcw, AlertTriangle, Layers, Clock } from "lucide-react"
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
  const [tab, setTab] = useState("ALL") // "ALL" | "PENDING" | "APPROVED"
  const [selected, setSelected] = useState([]) // Array of form IDs to sign
  const [selectedFormId, setSelectedFormId] = useState(null)
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
      (user?.id ? localStorage.getItem(`user_signature_${user.id}`) : null) ||
      user.signatureSpecimenUrl ||
      null
    )
  }, [user])

  // Phân loại danh sách phiếu
  const pendingForms = useMemo(
    () => forms.filter((f) => f.status === "CLASS_APPROVED"),
    [forms]
  )
  const approvedForms = useMemo(
    () => forms.filter((f) => f.status === "DEAN_APPROVED"),
    [forms]
  )

  const displayForms = useMemo(() => {
    if (tab === "PENDING") return pendingForms
    if (tab === "APPROVED") return approvedForms
    return forms
  }, [tab, forms, pendingForms, approvedForms])

  // Load forms for this class or department
  const fetchForms = async (forceApprovedTab = false) => {
    setLoading(true)
    try {
      let list = []
      try {
        list = await reviewService.getBatchForms(classId || "all", "ALL")
      } catch {
        list = await reviewService.list(0, 200)
      }

      if (!Array.isArray(list)) list = []

      // Lọc theo classId nếu không phải 'all'
      let filtered = list
      if (classId && classId !== "all") {
        const matches = list.filter((f) => {
          const rawClassId = f.raw?.student?.classEntity?.id
          const rawClassCode = f.raw?.student?.classEntity?.classCode
          return (
            String(rawClassId) === String(classId) ||
            String(rawClassCode).toLowerCase() === String(classId).toLowerCase() ||
            String(f.className).toLowerCase() === String(classId).toLowerCase()
          )
        })
        if (matches.length > 0) {
          filtered = matches
        }
      }

      setForms(filtered)

      const pCount = filtered.filter((f) => f.status === "CLASS_APPROVED").length
      const aCount = filtered.filter((f) => f.status === "DEAN_APPROVED").length

      // Tự động chuyển tab thông minh
      if (forceApprovedTab || (pCount === 0 && aCount > 0)) {
        setTab("APPROVED")
      } else if (pCount > 0 && aCount === 0) {
        setTab("PENDING")
      }

      // Mặc định chọn tất cả phiếu chờ duyệt
      const pendingIds = filtered
        .filter((f) => f.status === "CLASS_APPROVED")
        .map((f) => String(f.id))
      setSelected(pendingIds)

      if (filtered.length > 0) {
        setClassNameInfo(filtered[0]?.className || "")
        // Đặt phiếu xem trước ban đầu
        setSelectedFormId((prev) => {
          if (prev && filtered.some((f) => String(f.id) === String(prev))) {
            return prev
          }
          return (
            filtered.find((f) => f.status === "CLASS_APPROVED")?.id ||
            filtered[0]?.id ||
            null
          )
        })
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

  // Form đang được chọn để xem chi tiết
  const currentForm = useMemo(() => {
    if (!selectedFormId) return displayForms[0] || forms[0] || null
    return (
      forms.find((f) => String(f.id) === String(selectedFormId)) ||
      displayForms[0] ||
      forms[0] ||
      null
    )
  }, [selectedFormId, forms, displayForms])

  // Tải chi tiết phiếu hiện tại để xem trước bản PDF
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
      toast.error("Vui lòng chọn ít nhất 1 phiếu chờ duyệt để ký.")
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
    const selectedIds = selected.filter(Boolean)

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

      // Cập nhật lại danh sách phiếu
      fetchForms()
    } catch (err) {
      toast.error(err.message || "Lỗi khi trả lại phiếu")
    } finally {
      setSubmitting(false)
    }
  }

  const displayTitle =
    classId === "all"
      ? "Toàn bộ phiếu cấp Khoa"
      : classNameInfo
      ? `Lô lớp: ${classNameInfo}`
      : `Lô lớp #${classId || "CNTT"}`

  const subtitleText = useMemo(() => {
    if (forms.length === 0) return "Lô lớp này hiện chưa có phiếu nào"
    if (pendingForms.length > 0 && approvedForms.length > 0) {
      return `${pendingForms.length} phiếu chờ ký duyệt · ${approvedForms.length} phiếu đã ký duyệt`
    }
    if (pendingForms.length > 0) {
      return `${pendingForms.length} phiếu sẵn sàng phê duyệt cấp Khoa`
    }
    return `Đã ký duyệt toàn bộ (${approvedForms.length} phiếu) · Nhấn vào từng phiếu để xem lại bản PDF đã ký`
  }, [forms.length, pendingForms.length, approvedForms.length])

  return (
    <>
      {/* 1. HEADER THANH ĐIỀU HƯỚNG & HÀNH ĐỘNG */}
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => navigate("/dean/batches")}>
            <ArrowLeft className="size-4 mr-1" />
            Quay lại
          </Button>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-semibold text-slate-800 truncate">
              {displayTitle}
            </h1>
            <p className="text-xs text-muted truncate">{subtitleText}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
          {currentForm && currentForm.status === "CLASS_APPROVED" && (
            <Button
              variant="secondary"
              onClick={() => {
                setRejectReason(
                  `Yêu cầu xem xét lại điểm hoặc bổ sung minh chứng cho phiếu ĐRL của ${currentForm.name}.`
                )
                setRejectModalOpen(true)
              }}
              disabled={submitting}
              className="flex-1 sm:flex-none text-rose-600 border-rose-200 hover:bg-rose-50"
            >
              <RotateCcw className="size-3.5 mr-1" />
              Trả lại phiếu này
            </Button>
          )}

          {pendingForms.length > 0 ? (
            <Button
              variant="primary"
              className="flex-1 sm:flex-none bg-brand text-white shadow-sm"
              onClick={handleOpenSignModal}
              disabled={selected.length === 0 || submitting}
              loading={submitting}
            >
              Ký duyệt lô ({selected.length}/{pendingForms.length} phiếu)
            </Button>
          ) : approvedForms.length > 0 ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
              <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
              Đã ký duyệt xong toàn bộ lô
            </div>
          ) : null}
        </div>
      </div>

      {/* 2. NỘI DUNG CHÍNH: DANH SÁCH BÊN TRÁI & XEM TRƯỚC PDF BÊN PHẢI */}
      <div className="grid gap-4 lg:grid-cols-[1.05fr_.95fr]">
        {/* CỘT TRÁI: TABS VÀ DANH SÁCH PHIẾU */}
        <Card className="p-0 border border-slate-200 shadow-sm flex flex-col h-[740px] overflow-hidden bg-white">
          {/* HEADER DANH SÁCH & TABS PHÂN LOẠI */}
          <div className="border-b border-line bg-slate-50/70 p-3">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-1.5">
                <Layers className="size-4 text-brand" />
                <span className="text-sm font-bold text-slate-800">Danh sách phiếu</span>
                <span className="text-xs text-muted">({displayForms.length}/{forms.length})</span>
              </div>

              {pendingForms.length > 0 && (
                <label className="text-xs flex items-center gap-1.5 cursor-pointer font-medium text-slate-600 hover:text-slate-900 select-none">
                  <input
                    type="checkbox"
                    checked={
                      pendingForms.length > 0 &&
                      selected.length === pendingForms.length
                    }
                    onChange={(e) =>
                      setSelected(e.target.checked ? pendingForms.map((f) => String(f.id)) : [])
                    }
                    className="accent-brand size-3.5"
                  />
                  Chọn ({selected.length}/{pendingForms.length} chờ ký)
                </label>
              )}
            </div>

            {/* TABS PHÂN LOẠI: TẤT CẢ / CHỜ KÝ / ĐÃ KÝ */}
            <div className="flex items-center gap-1.5 bg-slate-200/70 p-1 rounded-lg text-xs font-semibold">
              <button
                type="button"
                onClick={() => setTab("ALL")}
                className={`flex-1 py-1.5 px-2 rounded-md transition text-center ${
                  tab === "ALL"
                    ? "bg-white text-brand shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Tất cả ({forms.length})
              </button>
              <button
                type="button"
                onClick={() => setTab("PENDING")}
                className={`flex-1 py-1.5 px-2 rounded-md transition text-center flex items-center justify-center gap-1 ${
                  tab === "PENDING"
                    ? "bg-white text-amber-700 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span>Chờ ký</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  tab === "PENDING" ? "bg-amber-100 text-amber-800" : "bg-slate-300 text-slate-700"
                }`}>
                  {pendingForms.length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setTab("APPROVED")}
                className={`flex-1 py-1.5 px-2 rounded-md transition text-center flex items-center justify-center gap-1 ${
                  tab === "APPROVED"
                    ? "bg-white text-emerald-700 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span>Đã ký số</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  tab === "APPROVED" ? "bg-emerald-100 text-emerald-800" : "bg-slate-300 text-slate-700"
                }`}>
                  {approvedForms.length}
                </span>
              </button>
            </div>
          </div>

          {/* DANH SÁCH CUỘN */}
          <div className="flex-1 overflow-auto divide-y divide-line">
            {loading ? (
              <div className="p-12 text-center text-muted">
                <div className="animate-spin inline-block size-6 border-2 border-brand border-t-transparent rounded-full mb-2" />
                <p className="text-xs">Đang tải danh sách phiếu...</p>
              </div>
            ) : displayForms.length === 0 ? (
              <div className="p-12 text-center text-muted">
                {tab === "PENDING" && approvedForms.length > 0 ? (
                  <>
                    <CheckCircle2 className="mx-auto size-12 text-emerald-500 mb-2" />
                    <h3 className="text-sm font-semibold text-slate-700">Tất cả phiếu đã được ký duyệt</h3>
                    <p className="text-xs text-slate-400 mt-1">Không còn phiếu nào chờ phê duyệt trong lô này.</p>
                    <Button
                      variant="secondary"
                      className="mt-4 text-xs font-semibold text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                      onClick={() => setTab("APPROVED")}
                    >
                      Xem {approvedForms.length} phiếu đã ký duyệt
                    </Button>
                  </>
                ) : (
                  <>
                    <FileText className="mx-auto size-10 text-slate-300 mb-2" />
                    <h3 className="text-sm font-semibold text-slate-600">Không có phiếu nào</h3>
                    <p className="text-xs text-slate-400 mt-1">Không tìm thấy phiếu nào phù hợp với bộ lọc hiện tại.</p>
                  </>
                )}
              </div>
            ) : (
              displayForms.map((item) => {
                const isPending = item.status === "CLASS_APPROVED"
                const isApproved = item.status === "DEAN_APPROVED"
                const isSelectedForBatch = selected.includes(String(item.id))
                const isActive = currentForm?.id === item.id

                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedFormId(item.id)}
                    className={`flex items-center justify-between p-3.5 cursor-pointer transition select-none ${
                      isActive
                        ? "bg-brand-soft/40 border-l-4 border-l-brand"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {isPending ? (
                        <input
                          type="checkbox"
                          checked={isSelectedForBatch}
                          onClick={(e) => e.stopPropagation()}
                          onChange={() => {
                            setSelected((prev) =>
                              prev.includes(String(item.id))
                                ? prev.filter((x) => x !== String(item.id))
                                : [...prev, String(item.id)]
                            )
                          }}
                          className="accent-brand size-4 cursor-pointer shrink-0"
                        />
                      ) : (
                        <div className="size-4 flex items-center justify-center shrink-0">
                          <CheckCircle2 className="size-4 text-emerald-600" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <b className="text-sm text-slate-800 block truncate">{item.name}</b>
                        <small className="text-xs text-muted font-mono block truncate">
                          {item.code} · {item.className || classNameInfo}
                        </small>
                      </div>
                    </div>

                    <div className="text-right shrink-0 ml-2">
                      <span className="font-bold text-sm text-brand block">
                        {item.classScore != null ? `${item.classScore}đ` : `${item.score}đ`}
                      </span>
                      {isApproved ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200 mt-0.5">
                          <CheckCircle2 className="size-3" /> Đã ký số
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 border border-amber-200 mt-0.5">
                          <Clock className="size-3" /> Chờ ký
                        </span>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </Card>

        {/* CỘT PHẢI: BẢN XEM TRƯỚC BIỂU MẪU PDF HOÀN CHỈNH */}
        <div className="flex flex-col">
          <div className="mb-3 flex flex-wrap items-center justify-between border-b border-line pb-2 gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <FileText className="size-4 text-brand" />
                Bản xem trước biểu mẫu (Chuẩn chữ ký số)
              </span>
              {currentForm?.status === "DEAN_APPROVED" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="size-3" /> Đã hoàn tất ký số cấp Khoa
                </span>
              )}
            </div>
            {currentForm && (
              <span className="text-xs text-muted">
                Đang xem: <b>{currentForm.name}</b> ({currentForm.code})
              </span>
            )}
          </div>

          {loadingDetail ? (
            <div className="p-20 text-center text-muted bg-white border border-slate-200 rounded-xl shadow-sm">
              <div className="animate-spin inline-block size-8 border-3 border-brand border-t-transparent rounded-full mb-3" />
              <p className="text-xs">Đang nạp dữ liệu chi tiết phiếu & chữ ký số...</p>
            </div>
          ) : currentForm ? (
            <PdfViewer
              user={{
                fullName: activeDetail?.studentName || currentForm?.name || "Sinh viên",
                userID: activeDetail?.studentCode || currentForm?.code || "—",
                userCode: activeDetail?.studentCode || currentForm?.code || "—",
                className: activeDetail?.className || currentForm?.className || classNameInfo || "—",
                majorName: activeDetail?.majorName || "—",
                facultyName: activeDetail?.departmentName || "—",
                academicCohort: activeDetail?.academicCohort || "—",
                dob: activeDetail?.dob || "",
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
              deanSignature={
                activeDetail?.deanSignature ||
                (currentForm?.status === "DEAN_APPROVED" ? deanSig : null)
              }
              deanName={activeDetail?.deanName || user?.fullName || "Trưởng Khoa"}
            />
          ) : (
            <div className="p-20 text-center text-muted bg-white border border-slate-200 rounded-xl shadow-sm">
              <FileText className="mx-auto size-12 text-slate-300 mb-2" />
              <p className="text-sm font-medium text-slate-600">Chưa chọn phiếu nào</p>
              <p className="text-xs text-slate-400 mt-1">Chọn một phiếu từ danh sách bên trái để xem lại bản PDF.</p>
            </div>
          )}
        </div>
      </div>

      {/* 3. MODAL TRẢ LẠI PHIẾU CỦA TRƯỞNG KHOA */}
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

      {/* 4. MODAL XÁC NHẬN KÝ DUYỆT LÔ */}
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

      {/* 5. TIẾN TRÌNH KÝ DUYỆT LÔ */}
      <Modal open={progress} title="Tiến trình ký duyệt lô" wide onClose={() => {}}>
        <BatchSignProgress
          count={selected.length}
          onClose={() => {
            setProgress(false)
            setSelected([])
            fetchForms(true) // Tự động load lại và chuyển sang tab Đã ký duyệt
          }}
        />
      </Modal>
    </>
  )
}
