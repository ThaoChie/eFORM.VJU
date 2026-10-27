import { useState, useEffect, useMemo } from "react"
import {
  CalendarDays,
  Plus,
  Search,
  Eye,
  Play,
  CalendarClock,
  Ban,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Building2,
  RefreshCw,
  ArrowRight,
  History,
} from "lucide-react"
import toast from "react-hot-toast"
import { evaluationPeriodService } from "../../../services/evaluation-period-service"
import {
  Button,
  IconButton,
  Card,
  PageTitle,
  Modal,
  Input,
  Select,
  Table,
} from "../../../components/ui/Primitives"

export default function EvaluationPeriodListPage() {
  const [periods, setPeriods] = useState([])
  const [loading, setLoading] = useState(true)

  // Filter & Search states
  const [keyword, setKeyword] = useState("")
  const [semesterFilter, setSemesterFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")

  // Form options (Semesters, FormVersions, Scopes)
  const [options, setOptions] = useState({ semesters: [], formVersions: [], scopes: [] })

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [extendModalOpen, setExtendModalOpen] = useState(false)
  const [openConfirmModalOpen, setOpenConfirmModalOpen] = useState(false)
  const [closeConfirmModalOpen, setCloseConfirmModalOpen] = useState(false)

  // Selected period for actions
  const [selectedPeriod, setSelectedPeriod] = useState(null)
  const [periodDetail, setPeriodDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)

  // Create form state
  const [createForm, setCreateForm] = useState({
    semesterId: "",
    formVersionId: "",
    applicationScope: "Toàn trường",
    submissionDeadline: "",
  })
  const [createErrors, setCreateErrors] = useState({})
  const [creating, setCreating] = useState(false)

  // Extend form state
  const [newDeadline, setNewDeadline] = useState("")
  const [extendError, setExtendError] = useState("")
  const [extending, setExtending] = useState(false)

  // Action loading states
  const [actionLoading, setActionLoading] = useState(false)

  // Load form options once
  useEffect(() => {
    fetchFormOptions()
  }, [])

  // Load periods whenever filters change
  useEffect(() => {
    fetchPeriods()
  }, [semesterFilter, statusFilter])

  const fetchFormOptions = async () => {
    try {
      const res = await evaluationPeriodService.getFormOptions()
      setOptions(res || { semesters: [], formVersions: [], scopes: [] })
    } catch (err) {
      console.error("Lỗi tải danh mục options:", err)
    }
  }

  const fetchPeriods = async () => {
    setLoading(true)
    try {
      const res = await evaluationPeriodService.searchPeriods({
        keyword: keyword.trim() || undefined,
        semesterId: semesterFilter || undefined,
        status: statusFilter || undefined,
      })
      setPeriods(res || [])
    } catch (err) {
      console.error("Lỗi tải danh sách kỳ chấm ĐRL:", err)
      toast.error("Không thể tải danh sách kỳ chấm ĐRL")
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e?.preventDefault()
    fetchPeriods()
  }

  // Active form versions filtered by selected semester in create modal
  const availableFormVersions = useMemo(() => {
    if (!createForm.semesterId) return []
    return (options.formVersions || []).filter(
      (fv) => String(fv.semesterId) === String(createForm.semesterId)
    )
  }, [options.formVersions, createForm.semesterId])

  // Open Create Modal
  const handleOpenCreateModal = () => {
    const defaultSemester = options.semesters?.find((s) => s.isActive)?.id || options.semesters?.[0]?.id || ""
    setCreateForm({
      semesterId: defaultSemester ? String(defaultSemester) : "",
      formVersionId: "",
      applicationScope: options.scopes?.[0] || "Toàn trường",
      submissionDeadline: "",
    })
    setCreateErrors({})
    setCreateModalOpen(true)
  }

  // Auto-select active form version when semesterId changes
  useEffect(() => {
    if (availableFormVersions.length > 0 && !createForm.formVersionId) {
      setCreateForm((prev) => ({ ...prev, formVersionId: String(availableFormVersions[0].id) }))
    }
  }, [availableFormVersions])

  // Handle Create Period (Luồng C)
  const handleCreatePeriod = async (e) => {
    e.preventDefault()
    const errors = {}

    if (!createForm.semesterId) errors.semesterId = "Vui lòng chọn học kỳ"
    if (!createForm.formVersionId) errors.formVersionId = "Vui lòng chọn phiên bản biểu mẫu"
    if (!createForm.applicationScope) errors.applicationScope = "Vui lòng chọn phạm vi áp dụng"
    if (!createForm.submissionDeadline) {
      errors.submissionDeadline = "Vui lòng chọn hạn nộp"
    } else {
      const today = new Date().toISOString().split("T")[0]
      if (createForm.submissionDeadline < today) {
        errors.submissionDeadline = "Hạn nộp không được trước ngày hiện tại"
      }
    }

    if (Object.keys(errors).length > 0) {
      setCreateErrors(errors)
      return
    }

    setCreating(true)
    setCreateErrors({})
    try {
      await evaluationPeriodService.createPeriod({
        semesterId: Number(createForm.semesterId),
        formVersionId: Number(createForm.formVersionId),
        applicationScope: createForm.applicationScope,
        submissionDeadline: createForm.submissionDeadline,
      })
      toast.success("Tạo kỳ chấm ĐRL mới thành công (Trạng thái: Chưa mở)")
      setCreateModalOpen(false)
      fetchPeriods()
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Lỗi tạo kỳ chấm"
      if (msg.includes("409") || msg.includes("trùng") || msg.includes("Chưa mở hoặc Đang mở")) {
        setCreateErrors({
          form: "Đã có kỳ cùng Học kỳ và Phạm vi áp dụng đang Chưa mở hoặc Đang mở.",
        })
      } else {
        toast.error(msg)
      }
    } finally {
      setCreating(false)
    }
  }

  // Handle Open Detail & History (Luồng R)
  const handleViewDetail = async (period) => {
    setSelectedPeriod(period)
    setDetailModalOpen(true)
    setDetailLoading(true)
    try {
      const data = await evaluationPeriodService.getPeriodById(period.id)
      setPeriodDetail(data)
    } catch (err) {
      toast.error("Không thể tải chi tiết kỳ chấm")
    } finally {
      setDetailLoading(false)
    }
  }

  // Confirm Open Period (Luồng 7, 8)
  const handleConfirmOpenPeriod = async () => {
    if (!selectedPeriod) return
    setActionLoading(true)
    try {
      await evaluationPeriodService.openPeriod(selectedPeriod.id)
      toast.success("Đã mở kỳ chấm ĐRL thành công và gửi thông báo tới sinh viên!")
      setOpenConfirmModalOpen(false)
      setSelectedPeriod(null)
      fetchPeriods()
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Lỗi mở kỳ chấm ĐRL")
    } finally {
      setActionLoading(false)
    }
  }

  // Handle Open Extend Modal (Luồng U1)
  const handleOpenExtendModal = (period) => {
    setSelectedPeriod(period)
    setNewDeadline("")
    setExtendError("")
    setExtendModalOpen(true)
  }

  // Confirm Extend Deadline (Luồng U2)
  const handleConfirmExtendDeadline = async (e) => {
    e.preventDefault()
    if (!newDeadline) {
      setExtendError("Vui lòng chọn hạn nộp mới")
      return
    }
    if (newDeadline <= selectedPeriod.submissionDeadline) {
      setExtendError(`Hạn nộp mới phải muộn hơn hạn nộp hiện tại (${formatDate(selectedPeriod.submissionDeadline)})`)
      return
    }

    setExtending(true)
    try {
      await evaluationPeriodService.extendDeadline(selectedPeriod.id, newDeadline)
      toast.success("Gia hạn hạn nộp thành công!")
      setExtendModalOpen(false)
      setSelectedPeriod(null)
      fetchPeriods()
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Lỗi gia hạn hạn nộp")
    } finally {
      setExtending(false)
    }
  }

  // Confirm Close Period Early (Luồng U3, U4)
  const handleConfirmClosePeriod = async () => {
    if (!selectedPeriod) return
    setActionLoading(true)
    try {
      await evaluationPeriodService.closePeriod(selectedPeriod.id)
      toast.success("Đã đóng kỳ chấm ĐRL thành công!")
      setCloseConfirmModalOpen(false)
      setSelectedPeriod(null)
      fetchPeriods()
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Lỗi đóng kỳ chấm ĐRL")
    } finally {
      setActionLoading(false)
    }
  }

  // Helpers
  const formatDate = (dateStr) => {
    if (!dateStr) return "–"
    try {
      const [y, m, d] = dateStr.split("-")
      if (y && m && d) return `${d}/${m}/${y}`
      return dateStr
    } catch {
      return dateStr
    }
  }

  const formatDateTime = (isoStr) => {
    if (!isoStr) return "–"
    try {
      const d = new Date(isoStr)
      return d.toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch {
      return isoStr
    }
  }

  const renderStatusBadge = (status) => {
    switch (status) {
      case "DANG_MO":
        return (
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-700">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            Đang mở
          </span>
        )
      case "CHUA_MO":
        return (
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
            <span className="size-1.5 rounded-full bg-amber-400" />
            Chưa mở
          </span>
        )
      case "DA_DONG":
        return (
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
            <span className="size-1.5 rounded-full bg-slate-300" />
            Đã đóng
          </span>
        )
      default:
        return <span className="text-xs text-slate-500">{status}</span>
    }
  }

  const columns = [
    {
      key: "semesterName",
      title: "Học kỳ",
      render: (item) => (
        <div>
          <div className="font-medium text-ink">{item.semesterName}</div>
          {!item.semesterName?.includes(item.academicYear) && item.academicYear && (
            <div className="text-xs text-muted">Năm học {item.academicYear}</div>
          )}
        </div>
      ),
    },
    {
      key: "formName",
      title: "Phiên bản biểu mẫu",
      render: (item) => (
        <div>
          <div className="font-medium text-ink line-clamp-1">{item.formName}</div>
          <div className="text-xs text-muted mt-0.5">
            {item.formCode} ({item.formVersionNo})
          </div>
        </div>
      ),
    },
    {
      key: "applicationScope",
      title: "Phạm vi",
      render: (item) => (
        <span className="text-sm text-muted">{item.applicationScope || "Toàn trường"}</span>
      ),
    },
    {
      key: "submissionDeadline",
      title: "Hạn nộp",
      render: (item) => (
        <div>
          <div className="text-sm text-ink">{formatDate(item.submissionDeadline)}</div>
          {item.status === "DANG_MO" && item.remainingDays != null && (
            <div className="text-xs text-muted mt-0.5">Còn {item.remainingDays} ngày</div>
          )}
        </div>
      ),
    },
    {
      key: "status",
      title: "Trạng thái",
      render: (item) => renderStatusBadge(item.status),
    },
    {
      key: "actions",
      title: "Thao tác",
      render: (item) => (
        <div className="flex items-center gap-1">
          <IconButton
            label="Chi tiết"
            onClick={() => handleViewDetail(item)}
          >
            <Eye className="size-4" />
          </IconButton>
          {item.status === "CHUA_MO" && (
            <IconButton
              label="Mở kỳ"
              onClick={() => {
                setSelectedPeriod(item)
                setOpenConfirmModalOpen(true)
              }}
              className="text-emerald-600 hover:text-emerald-700"
            >
              <Play className="size-4" />
            </IconButton>
          )}
          {item.status === "DANG_MO" && (
            <IconButton
              label="Gia hạn"
              onClick={() => handleOpenExtendModal(item)}
              className="text-amber-600 hover:text-amber-700"
            >
              <CalendarClock className="size-4" />
            </IconButton>
          )}
          {item.status === "DANG_MO" && (
            <IconButton
              label="Đóng kỳ"
              onClick={() => {
                setSelectedPeriod(item)
                setCloseConfirmModalOpen(true)
              }}
              className="text-rose-600 hover:text-rose-700"
            >
              <Ban className="size-4" />
            </IconButton>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      {/* Header */}
      <PageTitle
        title="Quản lý kỳ chấm điểm rèn luyện"
        description="Mở kỳ chấm mới, phân bổ biểu mẫu áp dụng, theo dõi tiến độ nộp và đóng kỳ chấm điểm."
        action={
          <Button
            variant="primary"
            onClick={handleOpenCreateModal}
          >
            <Plus className="size-4" />
            Mở kỳ mới
          </Button>
        }
      />

      {/* Filter & Search Bar (UC006) */}
      <Card className="mb-4">
        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          {/* Keyword Search */}
          <Input
            label="Từ khóa tìm kiếm"
            placeholder="Tìm theo học kỳ, biểu mẫu, phạm vi..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />

          {/* Semester Filter */}
          <Select
            label="Học kỳ áp dụng"
            value={semesterFilter}
            onChange={(e) => setSemesterFilter(e.target.value)}
          >
            <option value="">Tất cả học kỳ</option>
            {options.semesters?.map((s) => (
              <option key={s.id} value={s.id}>
                {s.semesterName} ({s.academicYear})
              </option>
            ))}
          </Select>

          {/* Status Filter */}
          <Select
            label="Trạng thái kỳ"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="CHUA_MO">Chưa mở</option>
            <option value="DANG_MO">Đang mở</option>
            <option value="DA_DONG">Đã đóng</option>
          </Select>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button type="submit" variant="primary" className="flex-1 h-10">
              <Search className="size-4" />
              Tìm kiếm
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="h-10 px-3 text-muted hover:text-ink"
              onClick={() => {
                setKeyword("")
                setSemesterFilter("")
                setStatusFilter("")
                fetchPeriods()
              }}
              title="Đặt lại bộ lọc"
            >
              <RefreshCw className="size-4" />
            </Button>
          </div>
        </form>
      </Card>

      {/* Periods Table */}
      <Table columns={columns} rows={periods} loading={loading} />

      <div className="mt-3 flex justify-between text-xs text-muted">
        <span>Hiển thị {periods.length} kỳ chấm</span>
        <span>Trang 1 / 1</span>
      </div>

      {/* ========================================================================= */}
      {/* 1. Modal: Mở kỳ mới (C) */}
      {/* ========================================================================= */}
      <Modal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Thiết lập mở kỳ chấm ĐRL mới"
        wide={false}
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateModalOpen(false)}>
              Hủy
            </Button>
            <Button
              className="bg-slate-900 hover:bg-slate-800 border-slate-900 text-white"
              loading={creating}
              onClick={handleCreatePeriod}
            >
              Lưu kỳ (Chưa mở)
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreatePeriod} className="space-y-4">
          {createErrors.form && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700 flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0 text-rose-600" />
              <span>{createErrors.form}</span>
            </div>
          )}

          {/* Học kỳ */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Học kỳ áp dụng <span className="text-brand">*</span>
            </label>
            <select
              value={createForm.semesterId}
              onChange={(e) => {
                setCreateForm({
                  ...createForm,
                  semesterId: e.target.value,
                  formVersionId: "",
                })
              }}
              className="h-10 w-full rounded-lg border border-line bg-white px-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand-soft"
            >
              <option value="">-- Chọn học kỳ --</option>
              {options.semesters?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.semesterName} ({s.academicYear}) {s.isActive ? "• [Đang kích hoạt]" : ""}
                </option>
              ))}
            </select>
            {createErrors.semesterId && (
              <span className="block mt-1 text-xs text-brand">{createErrors.semesterId}</span>
            )}
          </div>

          {/* Phiên bản biểu mẫu (chỉ chọn phiên bản ACTIVE của học kỳ) */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Phiên bản biểu mẫu hiệu lực <span className="text-brand">*</span>
            </label>
            <select
              value={createForm.formVersionId}
              onChange={(e) => setCreateForm({ ...createForm, formVersionId: e.target.value })}
              className="h-10 w-full rounded-lg border border-line bg-white px-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand-soft"
              disabled={!createForm.semesterId}
            >
              <option value="">-- Chọn phiên bản biểu mẫu --</option>
              {availableFormVersions.map((fv) => (
                <option key={fv.id} value={fv.id}>
                  {fv.formName} ({fv.formCode} {fv.versionNo})
                </option>
              ))}
            </select>
            {availableFormVersions.length === 0 && createForm.semesterId && (
              <span className="block mt-1 text-xs text-amber-600">
                Chưa có phiên bản biểu mẫu ACTIVE nào cho học kỳ này.
              </span>
            )}
            {createErrors.formVersionId && (
              <span className="block mt-1 text-xs text-brand">{createErrors.formVersionId}</span>
            )}
          </div>

          {/* Phạm vi áp dụng */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Phạm vi áp dụng <span className="text-brand">*</span>
            </label>
            <select
              value={createForm.applicationScope}
              onChange={(e) => setCreateForm({ ...createForm, applicationScope: e.target.value })}
              className="h-10 w-full rounded-lg border border-line bg-white px-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand-soft"
            >
              {options.scopes?.map((sc) => (
                <option key={sc} value={sc}>
                  {sc}
                </option>
              ))}
            </select>
            {createErrors.applicationScope && (
              <span className="block mt-1 text-xs text-brand">{createErrors.applicationScope}</span>
            )}
          </div>

          {/* Hạn nộp */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Hạn nộp sinh viên hoàn thành <span className="text-brand">*</span>
            </label>
            <input
              type="date"
              value={createForm.submissionDeadline}
              min={new Date().toISOString().split("T")[0]}
              onChange={(e) => setCreateForm({ ...createForm, submissionDeadline: e.target.value })}
              className="h-10 w-full rounded-lg border border-line bg-white px-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand-soft"
            />
            {createErrors.submissionDeadline && (
              <span className="block mt-1 text-xs text-brand">{createErrors.submissionDeadline}</span>
            )}
            <p className="mt-1 text-xs text-slate-400">
              Hạn nộp không được trước ngày hiện tại. Kỳ tạo xong sẽ ở trạng thái Chưa mở.
            </p>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* 2. Modal: Xem chi tiết & Lịch sử thay đổi (R) */}
      {/* ========================================================================= */}
      <Modal
        open={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title="Chi tiết kỳ chấm ĐRL & Lịch sử thay đổi"
        wide={true}
        footer={
          <Button variant="secondary" onClick={() => setDetailModalOpen(false)}>
            Đóng
          </Button>
        }
      >
        {detailLoading ? (
          <div className="py-12 text-center text-slate-400">
            <RefreshCw className="size-6 animate-spin text-brand mx-auto mb-2" />
            <p className="text-xs">Đang tải chi tiết...</p>
          </div>
        ) : periodDetail ? (
          <div className="space-y-6">
            {/* Overview cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-line bg-slate-50 space-y-2">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Thông tin học kỳ & phạm vi
                </div>
                <div className="text-base font-bold text-slate-800">
                  {periodDetail.semesterName}
                </div>
                <div className="text-xs text-slate-600">
                  Niên khóa: <span className="font-medium text-slate-800">{periodDetail.academicYear}</span>
                </div>
                <div className="text-xs text-slate-600">
                  Phạm vi áp dụng: <span className="font-semibold text-slate-800">{periodDetail.applicationScope}</span>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-line bg-slate-50 space-y-2">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Biểu mẫu & Hạn nộp
                </div>
                <div className="text-base font-bold text-slate-800">
                  {periodDetail.formName}
                </div>
                <div className="text-xs text-slate-600">
                  Mã phiên bản: <span className="font-mono font-medium text-slate-800">{periodDetail.formCode} ({periodDetail.formVersionNo})</span>
                </div>
                <div className="text-xs text-slate-600 flex items-center justify-between">
                  <span>Hạn nộp: <strong className="text-slate-800">{formatDate(periodDetail.submissionDeadline)}</strong></span>
                  <div>{renderStatusBadge(periodDetail.status)}</div>
                </div>
              </div>
            </div>

            {/* Audit Logs Section */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <History className="size-4 text-slate-600" />
                <h3 className="text-sm font-bold text-slate-800">
                  Lịch sử thay đổi kỳ chấm (Audit Logs)
                </h3>
              </div>

              {!periodDetail.history || periodDetail.history.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">Chưa có lịch sử thay đổi.</p>
              ) : (
                <div className="border border-line rounded-lg overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-600 border-b border-line font-semibold">
                      <tr>
                        <th className="py-2.5 px-3">Thời gian</th>
                        <th className="py-2.5 px-3">Người thực hiện</th>
                        <th className="py-2.5 px-3">Hành động</th>
                        <th className="py-2.5 px-3">Ghi chú</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {periodDetail.history.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-medium text-slate-600 whitespace-nowrap">
                            {formatDateTime(log.createdAt)}
                          </td>
                          <td className="py-2.5 px-3 font-medium text-slate-800">
                            {log.actorName}
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <span className="font-semibold text-slate-700">
                              {log.actionDisplayName || log.action}
                            </span>
                            {log.toStatus && (
                              <span className="ml-1 text-slate-400">
                                ({log.fromStatus ? `${log.fromStatus} → ` : ""}{log.toStatus})
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600">
                            {log.note || "–"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </Modal>

      {/* ========================================================================= */}
      {/* 3. Modal: Gia hạn hạn nộp (U1, U2) */}
      {/* ========================================================================= */}
      <Modal
        open={extendModalOpen}
        onClose={() => setExtendModalOpen(false)}
        title="Gia hạn hạn nộp kỳ chấm ĐRL"
        wide={false}
        footer={
          <>
            <Button variant="secondary" onClick={() => setExtendModalOpen(false)}>
              Hủy
            </Button>
            <Button
              className="bg-slate-900 hover:bg-slate-800 border-slate-900 text-white"
              loading={extending}
              onClick={handleConfirmExtendDeadline}
            >
              Xác nhận gia hạn
            </Button>
          </>
        }
      >
        <form onSubmit={handleConfirmExtendDeadline} className="space-y-4">
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
            <div>
              <span className="text-slate-500">Kỳ chấm:</span> {selectedPeriod?.semesterName}
            </div>
            <div>
              <span className="text-slate-500">Hạn nộp hiện tại:</span> {formatDate(selectedPeriod?.submissionDeadline)}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Hạn nộp mới <span className="text-brand">*</span>
            </label>
            <input
              type="date"
              value={newDeadline}
              min={selectedPeriod?.submissionDeadline || new Date().toISOString().split("T")[0]}
              onChange={(e) => {
                setNewDeadline(e.target.value)
                setExtendError("")
              }}
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-400"
            />
            {extendError && (
              <span className="block mt-1 text-xs text-brand">{extendError}</span>
            )}
            <p className="mt-1 text-xs text-slate-400">
              Hạn nộp mới bắt buộc phải muộn hơn hạn nộp hiện tại.
            </p>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* 4. Modal: Xác nhận Mở kỳ (Luồng 7, 8) */}
      {/* ========================================================================= */}
      <Modal
        open={openConfirmModalOpen}
        onClose={() => setOpenConfirmModalOpen(false)}
        title="Xác nhận mở kỳ chấm ĐRL"
        wide={false}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpenConfirmModalOpen(false)}>
              Hủy
            </Button>
            <Button
              className="bg-slate-900 hover:bg-slate-800 border-slate-900 text-white"
              loading={actionLoading}
              onClick={handleConfirmOpenPeriod}
            >
              Xác nhận mở kỳ
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-sm text-slate-700">
          <p>
            Bạn có chắc chắn muốn chuyển trạng thái kỳ chấm{" "}
            <span className="font-medium text-slate-900">{selectedPeriod?.semesterName}</span> sang <span className="font-medium text-slate-900">Đang mở</span>?
          </p>
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
            <div className="flex items-center gap-1.5 font-medium text-slate-700">
              <CheckCircle2 className="size-3.5 text-slate-500" />
              Quy trình tự động của hệ thống:
            </div>
            <ul className="list-disc pl-5 space-y-0.5 text-slate-500">
              <li>Sinh viên trong phạm vi áp dụng sẽ bắt đầu tạo và gửi phiếu ĐRL.</li>
              <li>Hệ thống tự động gửi thông báo mở kỳ chấm ĐRL đến toàn bộ sinh viên.</li>
              <li>Ghi nhận lịch sử thao tác vào hệ thống Audit Log.</li>
            </ul>
          </div>
        </div>
      </Modal>

      {/* ========================================================================= */}
      {/* 5. Modal: Xác nhận Đóng kỳ sớm (Luồng U3, U4) */}
      {/* ========================================================================= */}
      <Modal
        open={closeConfirmModalOpen}
        onClose={() => setCloseConfirmModalOpen(false)}
        title="Xác nhận đóng kỳ chấm ĐRL"
        wide={false}
        footer={
          <>
            <Button variant="secondary" onClick={() => setCloseConfirmModalOpen(false)}>
              Hủy
            </Button>
            <Button
              className="bg-slate-900 hover:bg-slate-800 border-slate-900 text-white"
              loading={actionLoading}
              onClick={handleConfirmClosePeriod}
            >
              Đóng kỳ ngay
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-sm text-slate-700">
          <p>
            Bạn có chắc chắn muốn đóng kỳ chấm{" "}
            <span className="font-medium text-slate-900">{selectedPeriod?.semesterName}</span>?
          </p>
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
            <div className="flex items-center gap-1.5 font-medium text-slate-700">
              <AlertCircle className="size-3.5 text-slate-500" />
              Lưu ý quan trọng:
            </div>
            <ul className="list-disc pl-5 space-y-0.5 text-slate-500">
              <li>Sau khi đóng kỳ, sinh viên sẽ không thể tạo mới phiếu cho kỳ này.</li>
              <li>Kỳ đã đóng không thể mở lại theo quy tắc nghiệp vụ.</li>
            </ul>
          </div>
        </div>
      </Modal>
    </div>
  )
}
