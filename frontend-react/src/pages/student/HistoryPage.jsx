import { Download, Eye, FileText, Loader2, RefreshCw } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "react-hot-toast"
import PdfViewer from "../../components/ui/PdfViewer"
import StatusTag from "../../components/ui/StatusTag"
import {
  Button,
  Card,
  IconButton,
  Modal,
  PageTitle,
  Table,
} from "../../components/ui/Primitives"
import { submissionService } from "../../services/submission-service"
import { useAuthStore } from "../../stores/useAuthStore"

export default function HistoryPage() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)

  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingFormId, setLoadingFormId] = useState(null)
  const [selectedForm, setSelectedForm] = useState(null)
  const [pdfModalOpen, setPdfModalOpen] = useState(false)

  // Tải danh sách lịch sử phiếu từ backend
  const loadHistory = async () => {
    try {
      setLoading(true)
      const data = await submissionService.getHistory()
      setRows(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error("Lỗi khi tải lịch sử phiếu:", err)
      toast.error("Không thể tải danh sách lịch sử phiếu.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadHistory()
  }, [])

  // Mở modal xem PDF chi tiết của 1 phiếu
  const handleViewPdf = async (formId) => {
    try {
      setLoadingFormId(formId)
      const formDetail = await submissionService.getMyFormById(formId)
      setSelectedForm(formDetail)
      setPdfModalOpen(true)
    } catch (err) {
      console.error("Lỗi khi tải chi tiết phiếu:", err)
      toast.error("Không thể tải thông tin chi tiết phiếu.")
    } finally {
      setLoadingFormId(null)
    }
  }

  // Tải / In phiếu PDF
  const handleDownloadPdf = async (row) => {
    if (row.pdfFileUrl && row.pdfFileUrl.trim() !== "") {
      window.open(row.pdfFileUrl, "_blank")
      return
    }
    // Nếu chưa có file s3 trực tiếp, mở modal để sinh viên xem và chọn In / Xuất PDF
    await handleViewPdf(row.id)
    toast.success("Vui lòng nhấn nút 'In / Xuất PDF' trên thanh công cụ để lưu file.")
  }

  // Chuyển đổi chi tiết điểm của phiếu đang chọn thành Map cho PdfViewer
  const { scoresMap, classScoresMap } = useMemo(() => {
    const sMap = {}
    const cMap = {}
    if (selectedForm && Array.isArray(selectedForm.details)) {
      selectedForm.details.forEach((d) => {
        if (d.criteriaCode) {
          if (d.studentScore != null) sMap[d.criteriaCode] = Number(d.studentScore)
          if (d.classScore != null) cMap[d.criteriaCode] = Number(d.classScore)
        }
      })
    }
    return { scoresMap: sMap, classScoresMap: cMap }
  }, [selectedForm])

  // Badge màu theo xếp loại
  const renderRankBadge = (rank) => {
    if (!rank || rank === "—") return <span className="text-slate-400">—</span>
    const rankConfig = {
      "Xuất sắc": "bg-purple-50 text-purple-700 border-purple-200",
      "Tốt": "bg-emerald-50 text-emerald-700 border-emerald-200",
      "Khá": "bg-blue-50 text-blue-700 border-blue-200",
      "Trung bình": "bg-amber-50 text-amber-700 border-amber-200",
      "Yếu": "bg-orange-50 text-orange-700 border-orange-200",
      "Kém": "bg-rose-50 text-rose-700 border-rose-200",
    }
    const color = rankConfig[rank] || "bg-slate-100 text-slate-700 border-slate-200"
    return (
      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${color}`}>
        {rank}
      </span>
    )
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <PageTitle
          title="Lịch sử phiếu"
          description="Danh sách các phiếu đánh giá điểm rèn luyện của sinh viên qua các học kỳ."
        />
        <Button variant="secondary" onClick={loadHistory} disabled={loading}>
          <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
          Làm mới
        </Button>
      </div>

      {loading ? (
        <Card className="flex flex-col items-center justify-center p-12 text-slate-500">
          <Loader2 className="size-8 animate-spin text-brand mb-3" />
          <p className="text-sm">Đang tải lịch sử phiếu rèn luyện...</p>
        </Card>
      ) : rows.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-4">
            <FileText className="size-7" />
          </div>
          <h3 className="text-base font-semibold text-slate-800">Chưa có phiếu đánh giá nào</h3>
          <p className="mt-1 text-sm text-slate-500 max-w-md">
            Bạn chưa thực hiện đánh giá điểm rèn luyện nào hoặc chưa có phiếu nào được khởi tạo.
          </p>
          <Button
            variant="primary"
            className="mt-5 bg-brand text-white"
            onClick={() => navigate("/student/compose")}
          >
            Đến trang đánh giá rèn luyện
          </Button>
        </Card>
      ) : (
        <Table
          rows={rows}
          columns={[
            {
              key: "stt",
              title: "STT",
              render: (_, i) => <span className="font-mono text-slate-600">{i + 1}</span>,
            },
            {
              key: "semesterName",
              title: "Học kỳ",
              render: (r) => (
                <div>
                  <span className="font-semibold text-slate-900">{r.semesterName || "Học kỳ đánh giá"}</span>
                  {r.academicYear && (
                    <span className="block text-xs text-slate-500">Năm học: {r.academicYear}</span>
                  )}
                </div>
              ),
            },
            {
              key: "score",
              title: "Tổng điểm",
              render: (r) => (
                <span className="font-bold font-mono text-slate-900">
                  {r.score != null ? `${r.score}đ` : "—"}
                </span>
              ),
            },
            {
              key: "ranking",
              title: "Xếp loại",
              render: (r) => renderRankBadge(r.ranking),
            },
            {
              key: "status",
              title: "Trạng thái",
              render: (r) => <StatusTag status={r.status} />,
            },
            {
              key: "date",
              title: "Ngày cập nhật",
              render: (r) => {
                const d = r.updatedAt || r.createdAt
                if (!d) return <span className="text-slate-400">—</span>
                try {
                  return (
                    <span className="text-slate-600 text-xs">
                      {new Date(d).toLocaleDateString("vi-VN", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  )
                } catch {
                  return <span className="text-slate-400">—</span>
                }
              },
            },
            {
              key: "action",
              title: "Thao tác",
              render: (r) => (
                <div className="flex items-center gap-1">
                  <IconButton
                    label="Xem PDF"
                    onClick={() => handleViewPdf(r.id)}
                    disabled={loadingFormId === r.id}
                  >
                    {loadingFormId === r.id ? (
                      <Loader2 className="size-4 animate-spin text-brand" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </IconButton>
                  <IconButton
                    label="Tải / In PDF"
                    onClick={() => handleDownloadPdf(r)}
                    disabled={loadingFormId === r.id}
                  >
                    <Download className="size-4" />
                  </IconButton>
                </div>
              ),
            },
          ]}
        />
      )}

      {/* MODAL XEM CHI TIẾT PHIẾU PDF CHUẨN */}
      <Modal
        open={pdfModalOpen}
        title={selectedForm?.semesterName ? `Phiếu ĐRL — ${selectedForm.semesterName}` : "Phiếu điểm rèn luyện"}
        wide
        onClose={() => {
          setPdfModalOpen(false)
          setSelectedForm(null)
        }}
      >
        {selectedForm && (
          <PdfViewer
            user={{
              fullName: user?.fullName || "Sinh viên",
              userID: user?.userID || user?.userCode || "—",
              userCode: user?.userCode || user?.userID || "—",
              className: user?.className || "—",
              majorName: "Công nghệ Thông tin",
              facultyName: user?.facultyName || user?.departmentName || "Khoa",
              academicCohort: user?.academicCohort || "2023 - 2027",
              signatureSpecimenUrl: selectedForm.studentSignature || user?.signatureSpecimenUrl,
            }}
            semesterName={selectedForm.semesterName}
            academicYear="2026 - 2027"
            official={selectedForm.status === "DEAN_APPROVED" || selectedForm.status === "CLASS_APPROVED"}
            scores={scoresMap}
            classScores={classScoresMap}
            studentTotal={selectedForm.studentTotal}
            classTotal={selectedForm.classTotal}
            finalTotal={selectedForm.finalTotal || selectedForm.classTotal || selectedForm.studentTotal}
            studentSignature={selectedForm.studentSignature}
            classSignature={
              selectedForm.status === "CLASS_APPROVED" ||
              selectedForm.status === "DEAN_APPROVED" ||
              selectedForm.status === "FACULTY_APPROVED"
                ? selectedForm.classSignature
                : null
            }
            classLeaderName={
              selectedForm.status === "CLASS_APPROVED" ||
              selectedForm.status === "DEAN_APPROVED" ||
              selectedForm.status === "FACULTY_APPROVED"
                ? selectedForm.classLeaderName || "Lớp trưởng"
                : ""
            }
            deanSignature={
              selectedForm.status === "DEAN_APPROVED" || selectedForm.status === "FACULTY_APPROVED"
                ? selectedForm.deanSignature
                : null
            }
            deanName={
              selectedForm.status === "DEAN_APPROVED" || selectedForm.status === "FACULTY_APPROVED"
                ? selectedForm.deanName || "Trưởng Khoa CNTT"
                : ""
            }
          />
        )}
      </Modal>
    </>
  )
}
