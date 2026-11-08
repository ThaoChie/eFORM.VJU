import { FileDown, Eye, ChevronLeft, ChevronRight, Search, FileText } from "lucide-react"
import { useState, useEffect } from "react"
import { toast } from "react-hot-toast"
import {
  ActionViewButton,
  Button,
  FilterBar,
  Input,
  PageTitle,
  Select,
  Table,
} from "../../components/ui/Primitives"
import PdfViewer from "../../components/ui/PdfViewer"
import { client } from "../../lib/axios/client"

export default function DeanReportPage({ school = false }) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [activePdfUrl, setActivePdfUrl] = useState(null)
  const [selectedFormForPdf, setSelectedFormForPdf] = useState(null)

  // Pagination
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalElements, setTotalElements] = useState(0)
  const pageSize = 15

  // Dropdown options
  const [classes, setClasses] = useState([])
  const [departments, setDepartments] = useState([])
  const [semesters, setSemesters] = useState([])

  // Filters
  const [keyword, setKeyword] = useState("")
  const [classId, setClassId] = useState("")
  const [deptId, setDeptId] = useState("")
  const [semesterId, setSemesterId] = useState("")

  // Fetch initial dropdown metadata
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [clsRes, deptRes, semRes] = await Promise.allSettled([
          client.get("/classes"),
          client.get("/departments"),
          client.get("/semesters"),
        ])
        if (clsRes.status === "fulfilled" && clsRes.value) {
          setClasses(Array.isArray(clsRes.value) ? clsRes.value : clsRes.value.content || [])
        }
        if (deptRes.status === "fulfilled" && deptRes.value) {
          setDepartments(Array.isArray(deptRes.value) ? deptRes.value : deptRes.value.content || [])
        }
        if (semRes.status === "fulfilled" && semRes.value) {
          setSemesters(Array.isArray(semRes.value) ? semRes.value : semRes.value.content || [])
        }
      } catch (e) {
        console.warn("Could not load full metadata dropdowns", e)
      }
    }
    fetchMetadata()
  }, [])

  // Fetch report data
  const fetchReport = async () => {
    setLoading(true)
    try {
      const params = {
        page: page - 1,
        size: pageSize,
      }
      if (keyword.trim()) params.studentCode = keyword.trim()
      if (classId) params.classId = classId
      if (school && deptId) params.deptId = deptId
      if (semesterId) params.semesterId = semesterId

      const res = await client.get("/reports/aggregate", { params })
      const content = res?.content || (Array.isArray(res) ? res : [])
      setData(content)
      setTotalPages(res?.totalPages || 1)
      setTotalElements(res?.totalElements || content.length)
    } catch (err) {
      console.error("Lỗi nạp báo cáo:", err)
      toast.error("Không thể nạp dữ liệu báo cáo")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReport()
  }, [page, classId, deptId, semesterId])

  const handleSearchSubmit = (e) => {
    e?.preventDefault?.()
    setPage(1)
    fetchReport()
  }

  // Export Excel
  const handleExportExcel = async () => {
    setExporting(true)
    try {
      const params = {}
      if (keyword.trim()) params.studentCode = keyword.trim()
      if (classId) params.classId = classId
      if (school && deptId) params.deptId = deptId
      if (semesterId) params.semesterId = semesterId

      const queryStr = new URLSearchParams(params).toString()
      const exportUrl = `/api/v1/reports/export-excel${queryStr ? "?" + queryStr : ""}`

      const token = localStorage.getItem("token")
      const response = await fetch(exportUrl, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })
      if (!response.ok) throw new Error("Xuất Excel thất bại")

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `Bao_cao_DRL_${school ? "Toan_truong" : "Khoa"}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success("Xuất file Excel báo cáo thành công!")
    } catch (err) {
      toast.error("Lỗi xuất file Excel: " + (err.message || "Lỗi hệ thống"))
    } finally {
      setExporting(false)
    }
  }

  // View PDF
  const handleViewPdf = async (row) => {
    if (row.pdfFileUrl) {
      setActivePdfUrl(row.pdfFileUrl)
      setSelectedFormForPdf(row)
      return
    }
    try {
      const res = await client.get(`/reports/forms/${row.id}/pdf`)
      const pdfUrl = res?.data || res
      if (pdfUrl && typeof pdfUrl === "string" && pdfUrl.trim()) {
        setActivePdfUrl(pdfUrl)
        setSelectedFormForPdf(row)
      } else {
        toast.error("Phiếu này chưa hoàn tất xuất bản file PDF đã ký.")
      }
    } catch (e) {
      toast.error("Biểu mẫu chưa có file PDF hoàn thiện hoặc chưa ký số đủ các cấp.")
    }
  }

  return (
    <>
      <PageTitle
        title={school ? "Báo cáo toàn trường" : "Báo cáo khoa"}
        description="Dữ liệu phiếu điểm rèn luyện tổng hợp từ hệ thống cơ sở dữ liệu."
        action={
          <Button
            variant="secondary"
            loading={exporting}
            disabled={exporting}
            onClick={handleExportExcel}
          >
            <FileDown className="size-4 mr-1.5" />
            Xuất Excel báo cáo
          </Button>
        }
      />

      <FilterBar showSearchButton={false}>
        <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
          <Input
            placeholder="Mã sinh viên hoặc Họ tên..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
          <Button type="submit" variant="secondary" className="text-xs">
            <Search className="size-3.5 mr-1" />
            Tìm
          </Button>
        </form>

        <Select
          value={classId}
          onChange={(e) => {
            setClassId(e.target.value)
            setPage(1)
          }}
        >
          <option value="">Tất cả lớp</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.className || c.classCode}
            </option>
          ))}
        </Select>

        {school && (
          <Select
            value={deptId}
            onChange={(e) => {
              setDeptId(e.target.value)
              setPage(1)
            }}
          >
            <option value="">Tất cả khoa quản lý</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.deptName || d.deptCode}
              </option>
            ))}
          </Select>
        )}

        <Select
          value={semesterId}
          onChange={(e) => {
            setSemesterId(e.target.value)
            setPage(1)
          }}
        >
          <option value="">Tất cả học kỳ</option>
          {semesters.map((s) => (
            <option key={s.id} value={s.id}>
              {s.semesterName || s.semesterCode}
            </option>
          ))}
        </Select>
      </FilterBar>

      <div className="mt-4">
        <Table
          loading={loading}
          rows={data}
          columns={[
            {
              key: "stt",
              title: "STT",
              render: (_, i) => (page - 1) * pageSize + i + 1,
            },
            {
              key: "name",
              title: "Họ và tên",
              render: (r) => (
                <span className="font-medium text-slate-800">
                  {r.studentName || "Sinh viên"}
                </span>
              ),
            },
            {
              key: "code",
              title: "Mã sinh viên",
              render: (r) => (
                <code className="text-xs bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                  {r.studentCode || "—"}
                </code>
              ),
            },
            {
              key: "class",
              title: "Lớp",
              render: (r) => r.className || "—",
            },
            {
              key: "year",
              title: "Niên khóa",
              render: (r) => r.academicCohort || "—",
            },
            {
              key: "faculty",
              title: "Khoa",
              render: (r) => r.departmentName || "—",
            },
            {
              key: "score",
              title: "Tổng điểm ĐRL",
              render: (r) => {
                const score = r.finalTotal != null ? r.finalTotal : (r.classTotal != null ? r.classTotal : r.studentTotal)
                return (
                  <span className="font-medium text-slate-900">
                    {score != null ? score : "0"}
                  </span>
                )
              },
            },
            {
              key: "rank",
              title: "Xếp loại",
              render: (r) => (
                <span className="text-xs text-slate-700">
                  {r.ranking || "—"}
                </span>
              ),
            },
            {
              key: "pdf",
              title: "Thao tác",
              render: (r) => (
                <div className="flex items-center gap-1">
                  <ActionViewButton
                    label="Xem PDF biểu mẫu"
                    onClick={() => handleViewPdf(r)}
                  />
                </div>
              ),
            },
          ]}
        />
      </div>

      {/* Phân trang */}
      <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
        <span>
          Hiển thị <strong>{data.length}</strong> / <strong>{totalElements}</strong> phiếu
        </span>
        {totalPages > 1 && (
          <div className="flex items-center gap-1.5">
            <Button
              variant="secondary"
              className="text-xs px-2.5 py-1"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="size-3.5" />
            </Button>
            <span className="px-2">
              Trang {page} / {totalPages}
            </span>
            <Button
              variant="secondary"
              className="text-xs px-2.5 py-1"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              <ChevronRight className="size-3.5" />
            </Button>
          </div>
        )}
      </div>

      {/* Modal xem PDF */}
      {activePdfUrl && (
        <PdfViewer
          pdfUrl={activePdfUrl}
          fileName={`Phieu_DRL_${selectedFormForPdf?.studentCode || "VJU"}.pdf`}
          onClose={() => {
            setActivePdfUrl(null)
            setSelectedFormForPdf(null)
          }}
        />
      )}
    </>
  )
}
