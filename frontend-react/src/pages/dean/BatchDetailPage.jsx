import { ArrowLeft, CheckSquare, FileText, CheckCircle2 } from "lucide-react"
import { useState, useEffect, useMemo } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { toast } from "react-hot-toast"
import { useAuthStore } from "../../stores/useAuthStore"
import { reviewService } from "../../services/review-service"
import { client } from "../../lib/axios/client"
import BatchSignProgress from "../../components/signature/BatchSignProgress"
import SignConfirmModal from "../../components/signature/SignConfirmModal"
import PdfViewer from "../../components/ui/PdfViewer"
import { Button, Card, Modal } from "../../components/ui/Primitives"

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
  const [sign, setSign] = useState(false)
  const [progress, setProgress] = useState(false)
  const [submitting, setSubmitting] = useState(false)

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
  useEffect(() => {
    let isMounted = true
    const fetchForms = async () => {
      setLoading(true)
      try {
        const res = await reviewService.list(0, 100)
        if (!isMounted) return
        const list = Array.isArray(res) ? res : []
        setForms(list)
        if (list.length > 0) {
          setSelected(list.map((_, i) => i))
        }
      } catch (err) {
        console.error("Lỗi khi tải danh sách phiếu lô:", err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    fetchForms()
    return () => {
      isMounted = false
    }
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

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Button onClick={() => navigate(-1)}>
          <ArrowLeft className="size-4" />
          Quay lại
        </Button>
        <div className="ml-2">
          <h1 className="text-lg font-semibold">Lô lớp {classId || "CNTT"}</h1>
          <p className="text-xs text-muted">
            {forms.length > 0
              ? `${forms.length} phiếu trong danh sách xét duyệt`
              : "Đang tải danh sách phiếu..."}
          </p>
        </div>
        <Button
          variant="primary"
          className="ml-auto"
          onClick={handleOpenSignModal}
          disabled={selected.length === 0 || submitting}
          loading={submitting}
        >
          Ký duyệt lô ({selected.length})
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.05fr_.95fr]">
        <Card className="p-0">
          <div className="flex items-center justify-between border-b border-line p-4">
            <b>Danh sách phiếu ({forms.length})</b>
            <label className="text-xs flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={forms.length > 0 && selected.length === forms.length}
                onChange={(e) =>
                  setSelected(
                    e.target.checked ? forms.map((_, i) => i) : []
                  )
                }
                className="accent-brand"
              />
              Chọn tất cả
            </label>
          </div>

          <div className="max-h-[650px] overflow-auto divide-y divide-line">
            {forms.map((item, i) => {
              const isSelected = selected.includes(i)
              const isActive = selectedIndex === i
              return (
                <div
                  key={item.id || i}
                  onClick={() => setSelectedIndex(i)}
                  className={`flex items-center justify-between p-3 cursor-pointer transition ${
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
                      <small className="text-xs text-muted font-mono">{item.code}</small>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-bold text-sm text-brand block">
                      {item.classScore != null ? `${item.classScore}đ` : `${item.score}đ`}
                    </span>
                    <span className="text-[11px] text-muted">
                      {item.status === "CLASS_APPROVED" ? "Lớp đã duyệt" : item.status}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        {/* PHẦN XEM TRƯỚC BẢN IN PDF */}
        <div>
          <div className="mb-3 flex items-center justify-between border-b border-line pb-2">
            <span className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <FileText className="size-4 text-brand" />
              Bản xem trước biểu mẫu (Có chữ ký)
            </span>
            {currentForm && (
              <span className="text-xs text-muted">
                Đang xem: <b>{currentForm.name}</b>
              </span>
            )}
          </div>

          <PdfViewer
            user={{
              fullName: activeDetail?.studentName || currentForm?.name || "Sinh viên",
              userID: activeDetail?.studentCode || currentForm?.code || "SV2026",
              userCode: activeDetail?.studentCode || currentForm?.code || "SV2026",
              className: activeDetail?.className || currentForm?.className || classId || "",
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
        </div>
      </div>

      <SignConfirmModal
        open={sign}
        level={3}
        userName={user?.fullName || "Trưởng Khoa"}
        signatureImage={deanSig}
        onNavigateToSignature={() => navigate("/dean/signature")}
        summary={`${selected.length} phiếu thuộc Lô lớp ${classId || "CNTT"}`}
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
