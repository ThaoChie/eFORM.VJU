import { useState, useEffect, useMemo } from "react"
import toast from "react-hot-toast"
import {
  Calendar,
  CalendarClock,
  Clock,
  AlertCircle,
  CheckCircle2,
  Play,
  Pencil,
  Trash2,
  Plus,
  Ban,
  ShieldCheck,
  ChevronRight,
  School,
  Lock,
  Layers,
  FileCheck,
  ArrowRight,
  Database,
  Building,
} from "lucide-react"

import {
  Table,
  Button,
  CreateButton,
  CancelButton,
  ConfirmButton,
  IconButton,
  ActionViewButton,
  Modal,
} from "../../../components/ui/Primitives"

import { evaluationPeriodService } from "../../../services/evaluation-period-service"
import { semesterService } from "../../../services/semester-service"

export default function EvaluationPeriodListPage() {
  // Data list state
  const [periods, setPeriods] = useState([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const pageSize = 10

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState("")
  const [semesterFilter, setSemesterFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")

  // Form options
  const [options, setOptions] = useState({
    semesters: [],
    formVersions: [],
    departments: [],
    classes: [],
    scopes: [],
  })

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deactivateConfirmModalOpen, setDeactivateConfirmModalOpen] = useState(false)
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
    periodCode: "",
    semesterId: "",
    formVersionId: "",
    applicationScope: "Toàn trường",
    applicableDepartmentIds: [],
    startDate: new Date().toISOString().split("T")[0],
    studentDeadline: "",
    classDeadline: "",
    deanDeadline: "",
  })
  const [createErrors, setCreateErrors] = useState({})
  const [creating, setCreating] = useState(false)

  // Edit form state
  const [editForm, setEditForm] = useState({
    id: null,
    periodCode: "",
    semesterId: "",
    formVersionId: "",
    applicationScope: "Toàn trường",
    applicableDepartmentIds: [],
    startDate: "",
    studentDeadline: "",
    classDeadline: "",
    deanDeadline: "",
  })
  const [editErrors, setEditErrors] = useState({})
  const [updating, setUpdating] = useState(false)
  const [deactivating, setDeactivating] = useState(false)

  // Extend & Exception form state
  const [extendForm, setExtendForm] = useState({
    extendScope: "ALL", // "ALL" hoặc "EXCEPTION"
    newStudentDeadline: "",
    newClassDeadline: "",
    newDeanDeadline: "",
    targetType: "CLASS", // "CLASS" hoặc "DEPARTMENT"
    targetId: "",
    exceptionDeadline: "",
    reason: "",
  })
  const [extendError, setExtendError] = useState("")
  const [extending, setExtending] = useState(false)

  // Action loading states
  const [actionLoading, setActionLoading] = useState(false)

  // Semester Management state
  const [semesterManagerOpen, setSemesterManagerOpen] = useState(false)
  const [semesterFormModalOpen, setSemesterFormModalOpen] = useState(false)
  const [semesterList, setSemesterList] = useState([])
  const [semesterListLoading, setSemesterListLoading] = useState(false)
  const [semesterForm, setSemesterForm] = useState({
    id: null,
    semesterCode: "",
    semesterName: "Học kỳ 1",
    academicYear: "2026-2027",
    startDate: "",
    endDate: "",
    isActive: false,
  })
  const [semesterSaving, setSemesterSaving] = useState(false)
  const [semesterErrors, setSemesterErrors] = useState({})

  const loadSemesters = async () => {
    setSemesterListLoading(true)
    try {
      const data = await semesterService.getAll()
      setSemesterList(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error("Lỗi tải danh sách học kỳ:", err)
      toast.error("Không thể tải danh sách học kỳ")
    } finally {
      setSemesterListLoading(false)
    }
  }

  const handleOpenCreateSemester = () => {
    setSemesterForm({
      id: null,
      semesterCode: "HK1_2026_2027",
      semesterName: "Học kỳ 1 Năm 2026-2027",
      academicYear: "2026-2027",
      startDate: "",
      endDate: "",
      isActive: true,
    })
    setSemesterErrors({})
    setSemesterFormModalOpen(true)
  }

  const handleOpenEditSemester = (sem) => {
    setSemesterForm({
      id: sem.id,
      semesterCode: sem.semesterCode || "",
      semesterName: sem.semesterName || "",
      academicYear: sem.academicYear || "",
      startDate: sem.startDate || "",
      endDate: sem.endDate || "",
      isActive: Boolean(sem.isActive),
    })
    setSemesterErrors({})
    setSemesterFormModalOpen(true)
  }

  const handleSaveSemester = async (e) => {
    e.preventDefault()
    const errs = {}
    if (!semesterForm.semesterCode?.trim()) errs.semesterCode = "Mã học kỳ bắt buộc"
    if (!semesterForm.semesterName?.trim()) errs.semesterName = "Tên học kỳ bắt buộc"
    if (!semesterForm.academicYear?.trim()) errs.academicYear = "Năm học bắt buộc"

    if (Object.keys(errs).length > 0) {
      setSemesterErrors(errs)
      return
    }

    setSemesterSaving(true)
    try {
      if (semesterForm.id) {
        await semesterService.update(semesterForm.id, semesterForm)
        toast.success("Cập nhật học kỳ thành công!")
      } else {
        const saved = await semesterService.create(semesterForm)
        toast.success("Thêm mới học kỳ thành công!")
        if (createModalOpen && saved?.id) {
          setCreateForm((prev) => ({ ...prev, semesterId: String(saved.id) }))
        }
      }
      setSemesterFormModalOpen(false)
      loadSemesters()
      loadFormOptions()
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Lỗi lưu học kỳ")
    } finally {
      setSemesterSaving(false)
    }
  }

  const handleDeleteSemester = async (id, name) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa học kỳ "${name}"? Thao tác này không thể hoàn tác.`)) return
    try {
      await semesterService.delete(id)
      toast.success("Đã xóa học kỳ!")
      loadSemesters()
      loadFormOptions()
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Không thể xóa học kỳ (đang được liên kết)")
    }
  }

  const loadFormOptions = async () => {
    try {
      const data = await evaluationPeriodService.getFormOptions()
      setOptions({
        semesters: data.semesters || [],
        formVersions: data.formVersions || [],
        departments: data.departments || [],
        classes: data.classes || [],
        scopes: data.scopes || ["Toàn trường", "Theo khoa"],
      })
    } catch (err) {
      console.error("Lỗi tải tùy chọn form:", err)
      toast.error("Không thể tải danh mục cấu hình")
    }
  }

  const fetchPeriods = async () => {
    setLoading(true)
    try {
      const params = {}
      if (searchTerm.trim()) params.keyword = searchTerm.trim()
      if (semesterFilter) params.semesterId = semesterFilter
      if (statusFilter) params.status = statusFilter

      const data = await evaluationPeriodService.searchPeriods(params)
      setPeriods(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error("Lỗi tải danh sách kỳ chấm:", err)
      toast.error("Không thể tải danh sách kỳ chấm ĐRL")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFormOptions()
  }, [])

  useEffect(() => {
    fetchPeriods()
  }, [searchTerm, semesterFilter, statusFilter])

  // Active form versions filtered by selected semester in create modal
  const availableFormVersions = useMemo(() => {
    if (!createForm.semesterId) return []
    return (options.formVersions || []).filter(
      (fv) => String(fv.semesterId) === String(createForm.semesterId)
    )
  }, [options.formVersions, createForm.semesterId])

  // Active form versions filtered by selected semester in edit modal
  const availableFormVersionsForEdit = useMemo(() => {
    if (!editForm.semesterId) return []
    return (options.formVersions || []).filter(
      (fv) => String(fv.semesterId) === String(editForm.semesterId)
    )
  }, [options.formVersions, editForm.semesterId])

  // Open Create Modal
  const handleOpenCreateModal = () => {
    const defaultSemester = options.semesters?.find((s) => s.isActive)?.id || options.semesters?.[0]?.id || ""
    const semObj = options.semesters?.find((s) => String(s.id) === String(defaultSemester))
    const today = new Date().toISOString().split("T")[0]
    
    // Gợi ý ngày mặc định
    const d1 = new Date()
    d1.setDate(d1.getDate() + 14)
    const svDeadline = d1.toISOString().split("T")[0]
    const d2 = new Date(d1)
    d2.setDate(d2.getDate() + 7)
    const clsDeadline = d2.toISOString().split("T")[0]
    const d3 = new Date(d2)
    d3.setDate(d3.getDate() + 7)
    const deanDeadline = d3.toISOString().split("T")[0]

    const suggestedCode = semObj ? (semObj.semesterCode || `HK${semObj.id}_${semObj.academicYear?.replace("-", "_")}`) : "HK1_2026_2027"

    setCreateForm({
      periodCode: suggestedCode,
      semesterId: defaultSemester ? String(defaultSemester) : "",
      formVersionId: "",
      applicationScope: "Toàn trường",
      applicableDepartmentIds: [],
      startDate: today,
      studentDeadline: svDeadline,
      classDeadline: clsDeadline,
      deanDeadline: deanDeadline,
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

  // Handle Create Period
  const handleCreatePeriod = async (e) => {
    e.preventDefault()
    const errors = {}

    if (!createForm.periodCode?.trim()) errors.periodCode = "Vui lòng nhập mã đợt đánh giá"
    if (!createForm.semesterId) errors.semesterId = "Vui lòng chọn học kỳ"
    if (!createForm.formVersionId) errors.formVersionId = "Vui lòng chọn phiên bản biểu mẫu áp dụng"
    if (!createForm.applicationScope) errors.applicationScope = "Vui lòng chọn phạm vi áp dụng"

    if (createForm.applicationScope === "Theo khoa" && (!createForm.applicableDepartmentIds || createForm.applicableDepartmentIds.length === 0)) {
      errors.applicableDepartmentIds = "Vui lòng chọn ít nhất 01 khoa áp dụng"
    }

    // Kiểm tra tính tuần tự của các mốc thời gian
    if (!createForm.startDate) errors.startDate = "Vui lòng chọn ngày bắt đầu"
    if (!createForm.studentDeadline) errors.studentDeadline = "Vui lòng chọn hạn SV nộp bài"
    if (!createForm.classDeadline) errors.classDeadline = "Vui lòng chọn hạn Lớp thẩm định"
    if (!createForm.deanDeadline) errors.deanDeadline = "Vui lòng chọn hạn Khoa duyệt lô"

    if (createForm.startDate && createForm.studentDeadline && createForm.studentDeadline <= createForm.startDate) {
      errors.studentDeadline = "Hạn SV nộp bài phải sau Ngày bắt đầu mở đợt"
    }
    if (createForm.studentDeadline && createForm.classDeadline && createForm.classDeadline <= createForm.studentDeadline) {
      errors.classDeadline = "Hạn Lớp thẩm định phải sau Hạn SV nộp bài"
    }
    if (createForm.classDeadline && createForm.deanDeadline && createForm.deanDeadline <= createForm.classDeadline) {
      errors.deanDeadline = "Hạn Khoa duyệt lô phải sau Hạn Lớp thẩm định"
    }

    if (Object.keys(errors).length > 0) {
      setCreateErrors(errors)
      return
    }

    setCreating(true)
    setCreateErrors({})
    try {
      await evaluationPeriodService.createPeriod({
        periodCode: createForm.periodCode.trim(),
        semesterId: Number(createForm.semesterId),
        formVersionId: Number(createForm.formVersionId),
        applicationScope: createForm.applicationScope,
        applicableDepartmentIds: createForm.applicableDepartmentIds.map(Number),
        startDate: createForm.startDate,
        studentDeadline: createForm.studentDeadline,
        classDeadline: createForm.classDeadline,
        deanDeadline: createForm.deanDeadline,
      })
      toast.success("Tạo kỳ chấm ĐRL mới thành công (Trạng thái: Chưa mở)")
      setCreateModalOpen(false)
      fetchPeriods()
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Lỗi tạo kỳ chấm"
      setCreateErrors({ form: msg })
    } finally {
      setCreating(false)
    }
  }

  // Open Edit Modal (Chỉnh sửa kỳ khi CHUA_MO)
  const handleOpenEditModal = (period) => {
    setSelectedPeriod(period)
    
    let deptIds = []
    if (period.applicableDepartments) {
      deptIds = period.applicableDepartments.split(",").map((s) => s.trim()).filter(Boolean)
    }

    setEditForm({
      id: period.id,
      periodCode: period.periodCode || "",
      semesterId: String(period.semesterId || ""),
      formVersionId: String(period.formVersionId || ""),
      applicationScope: period.applicationScope || "Toàn trường",
      applicableDepartmentIds: deptIds,
      startDate: period.startDate || "",
      studentDeadline: period.studentDeadline || period.submissionDeadline || "",
      classDeadline: period.classDeadline || "",
      deanDeadline: period.deanDeadline || "",
    })
    setEditErrors({})
    setEditModalOpen(true)
  }

  // Handle Update Period
  const handleUpdatePeriod = async (e) => {
    e.preventDefault()
    const errors = {}

    if (!editForm.periodCode?.trim()) errors.periodCode = "Vui lòng nhập mã đợt đánh giá"
    if (!editForm.semesterId) errors.semesterId = "Vui lòng chọn học kỳ"
    if (!editForm.formVersionId) errors.formVersionId = "Vui lòng chọn phiên bản biểu mẫu áp dụng"
    if (!editForm.applicationScope) errors.applicationScope = "Vui lòng chọn phạm vi áp dụng"

    if (editForm.applicationScope === "Theo khoa" && (!editForm.applicableDepartmentIds || editForm.applicableDepartmentIds.length === 0)) {
      errors.applicableDepartmentIds = "Vui lòng chọn ít nhất 01 khoa áp dụng"
    }

    // Kiểm tra tính tuần tự của thời hạn
    if (!editForm.startDate) errors.startDate = "Vui lòng chọn ngày bắt đầu"
    if (!editForm.studentDeadline) errors.studentDeadline = "Vui lòng chọn hạn SV nộp bài"
    if (!editForm.classDeadline) errors.classDeadline = "Vui lòng chọn hạn Lớp thẩm định"
    if (!editForm.deanDeadline) errors.deanDeadline = "Vui lòng chọn hạn Khoa duyệt"

    if (editForm.startDate && editForm.studentDeadline && editForm.studentDeadline <= editForm.startDate) {
      errors.studentDeadline = "Hạn SV nộp bài phải sau Ngày bắt đầu mở đợt"
    }
    if (editForm.studentDeadline && editForm.classDeadline && editForm.classDeadline <= editForm.studentDeadline) {
      errors.classDeadline = "Hạn Lớp thẩm định phải sau Hạn SV nộp bài"
    }
    if (editForm.classDeadline && editForm.deanDeadline && editForm.deanDeadline <= editForm.classDeadline) {
      errors.deanDeadline = "Hạn Khoa duyệt lô phải sau Hạn Lớp thẩm định"
    }

    if (Object.keys(errors).length > 0) {
      setEditErrors(errors)
      return
    }

    setUpdating(true)
    setEditErrors({})
    try {
      await evaluationPeriodService.updatePeriod(editForm.id, {
        periodCode: editForm.periodCode.trim(),
        semesterId: Number(editForm.semesterId),
        formVersionId: Number(editForm.formVersionId),
        applicationScope: editForm.applicationScope,
        applicableDepartmentIds: editForm.applicableDepartmentIds.map(Number),
        startDate: editForm.startDate,
        studentDeadline: editForm.studentDeadline,
        classDeadline: editForm.classDeadline,
        deanDeadline: editForm.deanDeadline,
      })
      toast.success("Cập nhật kỳ chấm ĐRL thành công!")
      setEditModalOpen(false)
      fetchPeriods()
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Lỗi cập nhật kỳ chấm"
      setEditErrors({ form: msg })
    } finally {
      setUpdating(false)
    }
  }

  // Open Deactivate Modal
  const handleOpenDeactivateModal = (period) => {
    setSelectedPeriod(period)
    setDeactivateConfirmModalOpen(true)
  }

  // Handle Deactivate Period
  const handleConfirmDeactivatePeriod = async () => {
    if (!selectedPeriod) return
    setDeactivating(true)
    try {
      await evaluationPeriodService.deactivatePeriod(selectedPeriod.id)
      toast.success(`Đã vô hiệu hóa kỳ chấm "${selectedPeriod.periodCode}" thành công!`)
      setDeactivateConfirmModalOpen(false)
      setSelectedPeriod(null)
      fetchPeriods()
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Lỗi vô hiệu hóa kỳ chấm")
    } finally {
      setDeactivating(false)
    }
  }

  // Handle Open Detail & History
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

  // Confirm Open / Activate Period
  const handleConfirmOpenPeriod = async () => {
    if (!selectedPeriod) return
    setActionLoading(true)
    try {
      await evaluationPeriodService.activatePeriod(selectedPeriod.id)
      toast.success("Kích hoạt mở đợt đánh giá thành công! Đã gửi thông báo tới sinh viên và cán bộ liên quan.")
      setOpenConfirmModalOpen(false)
      setSelectedPeriod(null)
      fetchPeriods()
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Lỗi kích hoạt đợt đánh giá")
    } finally {
      setActionLoading(false)
    }
  }

  // Handle Open Extend Modal
  const handleOpenExtendModal = (period) => {
    setSelectedPeriod(period)
    setExtendForm({
      extendScope: "ALL",
      newStudentDeadline: period.studentDeadline || period.submissionDeadline || "",
      newClassDeadline: period.classDeadline || "",
      newDeanDeadline: period.deanDeadline || "",
      targetType: "CLASS",
      targetId: options.classes?.[0]?.id || "",
      exceptionDeadline: "",
      reason: "",
    })
    setExtendError("")
    setExtendModalOpen(true)
  }

  // Confirm Extend Deadline / Add Exception
  const handleConfirmExtendDeadline = async (e) => {
    e.preventDefault()
    setExtendError("")

    if (extendForm.extendScope === "ALL") {
      if (!extendForm.newStudentDeadline) {
        setExtendError("Vui lòng chọn hạn SV nộp bài mới")
        return
      }
      if (selectedPeriod?.studentDeadline && extendForm.newStudentDeadline <= selectedPeriod.studentDeadline) {
        setExtendError(`Hạn SV nộp mới phải muộn hơn hạn hiện tại (${formatDate(selectedPeriod.studentDeadline)})`)
        return
      }
      if (extendForm.newClassDeadline && extendForm.newClassDeadline <= extendForm.newStudentDeadline) {
        setExtendError("Hạn Lớp thẩm định phải sau Hạn SV nộp bài")
        return
      }
      if (extendForm.newDeanDeadline && extendForm.newDeanDeadline <= extendForm.newClassDeadline) {
        setExtendError("Hạn Khoa duyệt lô phải sau Hạn Lớp thẩm định")
        return
      }
    } else {
      if (!extendForm.targetId) {
        setExtendError("Vui lòng chọn Lớp hoặc Khoa ngoại lệ")
        return
      }
      if (!extendForm.exceptionDeadline) {
        setExtendError("Vui lòng chọn thời hạn mở lẻ ngoại lệ")
        return
      }
      const today = new Date().toISOString().split("T")[0]
      if (extendForm.exceptionDeadline <= today) {
        setExtendError("Hạn mở lẻ ngoại lệ phải lớn hơn ngày hiện tại")
        return
      }
    }

    setExtending(true)
    try {
      const payload = {
        extendScope: extendForm.extendScope,
      }
      if (extendForm.extendScope === "ALL") {
        payload.newStudentDeadline = extendForm.newStudentDeadline
        payload.newClassDeadline = extendForm.newClassDeadline
        payload.newDeanDeadline = extendForm.newDeanDeadline
      } else {
        payload.targetType = extendForm.targetType
        payload.targetId = Number(extendForm.targetId)
        const targetObj = extendForm.targetType === "CLASS"
          ? options.classes.find((c) => String(c.id) === String(extendForm.targetId))
          : options.departments.find((d) => String(d.id) === String(extendForm.targetId))
        payload.targetName = targetObj ? (targetObj.className || targetObj.deptName) : `ID #${extendForm.targetId}`
        payload.exceptionDeadline = extendForm.exceptionDeadline
        payload.reason = extendForm.reason || "Cấp quyền mở lẻ ngoại lệ"
      }

      await evaluationPeriodService.extendDeadline(selectedPeriod.id, payload)
      toast.success(extendForm.extendScope === "ALL" ? "Gia hạn thời hạn chung thành công!" : "Cấp quyền mở lẻ ngoại lệ thành công!")
      setExtendModalOpen(false)
      setSelectedPeriod(null)
      fetchPeriods()
    } catch (err) {
      setExtendError(err.response?.data?.message || err.message || "Lỗi xử lý gia hạn/ngoại lệ")
    } finally {
      setExtending(false)
    }
  }

  // Open Close/Lock Period Modal
  const handleOpenClosePeriodModal = async (period) => {
    setSelectedPeriod(period)
    setCloseConfirmModalOpen(true)
    // Tải thông tin chi tiết tiến độ nộp phiếu
    try {
      const data = await evaluationPeriodService.getPeriodById(period.id)
      setSelectedPeriod(data)
    } catch (ignored) {}
  }

  // Confirm Close Period & Lock Down
  const handleConfirmClosePeriod = async () => {
    if (!selectedPeriod) return
    setActionLoading(true)
    try {
      await evaluationPeriodService.closePeriod(selectedPeriod.id)
      toast.success("Khóa sổ đợt đánh giá thành công! Dữ liệu đã được niêm phong và sẵn sàng đồng bộ sang Hệ thống Đào tạo.")
      setCloseConfirmModalOpen(false)
      setSelectedPeriod(null)
      fetchPeriods()
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Lỗi khóa sổ kỳ đánh giá")
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

  const renderStatusBadge = (status, isLocked) => {
    if (status === "VO_HIEU_HOA") {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs text-rose-600 font-medium">
          <Ban className="size-3 text-rose-500" />
          Vô hiệu hóa
        </span>
      )
    }
    if (isLocked || status === "DA_DONG") {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          <Lock className="size-3 text-slate-400" />
          Đã khóa sổ
        </span>
      )
    }
    switch (status) {
      case "DANG_MO":
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            Đang mở
          </span>
        )
      case "CHUA_MO":
        return (
          <span className="inline-flex items-center gap-1.5 text-xs text-amber-700 font-medium">
            <span className="size-1.5 rounded-full bg-amber-400" />
            Chưa mở
          </span>
        )
      default:
        return <span className="text-xs text-slate-500">{status}</span>
    }
  }

  const parseExceptionsList = (json) => {
    if (!json) return []
    try {
      return JSON.parse(json)
    } catch {
      return []
    }
  }

  const columns = [
    {
      key: "stt",
      title: "STT",
      render: (_, i) => (page - 1) * pageSize + i + 1,
    },
    {
      key: "periodInfo",
      title: "Mã đợt & Học kỳ",
      render: (item) => (
        <div>
          <div className="font-semibold text-ink flex items-center gap-1.5">
            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-xs font-mono text-slate-800 border border-slate-200">
              {item.periodCode}
            </span>
          </div>
          <div className="text-xs font-medium text-slate-700 mt-1">{item.semesterName}</div>
          {item.academicYear && (
            <div className="text-[11px] text-muted">Năm học {item.academicYear}</div>
          )}
        </div>
      ),
    },
    {
      key: "formName",
      title: "Biểu mẫu áp dụng",
      render: (item) => (
        <div>
          <div className="font-medium text-ink line-clamp-1">{item.formName}</div>
          <div className="text-xs text-muted mt-0.5 flex items-center gap-1">
            <span className="font-mono">{item.formCode}</span>
            <span className="px-1 py-0.2 rounded bg-emerald-50 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
              {item.formVersionNo}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "applicationScope",
      title: "Phạm vi",
      render: (item) => (
        <div>
          <span className="text-xs font-medium text-slate-700">{item.applicationScope || "Toàn trường"}</span>
          {item.applicableDepartmentNames && item.applicableDepartmentNames.length > 0 && (
            <div className="text-[11px] text-muted line-clamp-1" title={item.applicableDepartmentNames.join(", ")}>
              Khoa: {item.applicableDepartmentNames.join(", ")}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "timeline",
      title: "Thời hạn đánh giá",
      render: (item) => (
        <div className="space-y-0.5 text-xs">
          <div className="text-slate-600 flex items-center gap-1">
            <span className="text-muted w-16 inline-block">Sinh viên:</span>
            <span className="font-medium text-ink">{formatDate(item.studentDeadline || item.submissionDeadline)}</span>
            {item.status === "DANG_MO" && item.remainingDays != null && (
              <span className="text-[10px] text-amber-700 bg-amber-50 px-1 rounded ml-1">
                còn {item.remainingDays} ngày
              </span>
            )}
          </div>
          <div className="text-slate-600 flex items-center gap-1">
            <span className="text-muted w-16 inline-block">Cấp lớp:</span>
            <span className="font-medium text-ink">{formatDate(item.classDeadline)}</span>
          </div>
          <div className="text-slate-600 flex items-center gap-1">
            <span className="text-muted w-16 inline-block">Cấp khoa:</span>
            <span className="font-medium text-ink">{formatDate(item.deanDeadline)}</span>
          </div>
        </div>
      ),
    },
    {
      key: "status",
      title: "Trạng thái",
      render: (item) => renderStatusBadge(item.status, item.isLocked),
    },
    {
      key: "actions",
      title: "Thao tác",
      render: (item) => (
        <div className="flex items-center gap-1">
          <ActionViewButton
            label="Xem chi tiết"
            onClick={() => handleViewDetail(item)}
          />
          {item.status === "CHUA_MO" && (
            <>
              <IconButton
                label="Kích hoạt mở đợt đánh giá"
                onClick={() => {
                  setSelectedPeriod(item)
                  setOpenConfirmModalOpen(true)
                }}
                className="text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
              >
                <Play className="size-4" />
              </IconButton>
              <IconButton
                label="Chỉnh sửa đợt đánh giá"
                onClick={() => handleOpenEditModal(item)}
                className="text-brand hover:bg-brand-soft hover:text-brand-dark"
              >
                <Pencil className="size-4" />
              </IconButton>
              <IconButton
                label="Vô hiệu hóa đợt đánh giá"
                onClick={() => handleOpenDeactivateModal(item)}
                className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
              >
                <Ban className="size-4" />
              </IconButton>
            </>
          )}
          {item.status === "DANG_MO" && (
            <>
              <IconButton
                label="Gia hạn thời hạn / Cấp ngoại lệ"
                onClick={() => handleOpenExtendModal(item)}
                className="text-amber-600 hover:bg-amber-50 hover:text-amber-700"
              >
                <CalendarClock className="size-4" />
              </IconButton>
              <IconButton
                label="Vô hiệu hóa đợt đánh giá"
                onClick={() => handleOpenDeactivateModal(item)}
                className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
              >
                <Ban className="size-4" />
              </IconButton>
              <IconButton
                label="Khóa sổ & Kết thúc đợt"
                onClick={() => handleOpenClosePeriodModal(item)}
                className="text-slate-600 hover:bg-slate-100 hover:text-slate-800"
              >
                <Lock className="size-4" />
              </IconButton>
            </>
          )}
          {item.status === "VO_HIEU_HOA" && (
            <>
              <IconButton
                label="Kích hoạt lại đợt đánh giá"
                onClick={() => {
                  setSelectedPeriod(item)
                  setOpenConfirmModalOpen(true)
                }}
                className="text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
              >
                <Play className="size-4" />
              </IconButton>
              <IconButton
                label="Chỉnh sửa đợt đánh giá"
                onClick={() => handleOpenEditModal(item)}
                className="text-brand hover:bg-brand-soft hover:text-brand-dark"
              >
                <Pencil className="size-4" />
              </IconButton>
            </>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-ink">Quản lý kỳ chấm điểm rèn luyện</h1>
          <p className="text-xs sm:text-sm text-muted mt-1 max-w-2xl">
            Thiết lập thời hạn và theo dõi tiến độ đánh giá điểm rèn luyện sinh viên theo từng học kỳ.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="secondary"
            onClick={() => {
              loadSemesters()
              setSemesterManagerOpen(true)
            }}
            className="h-10 px-4 text-xs sm:text-sm font-medium whitespace-nowrap shrink-0 shadow-xs"
          >
            <School className="size-4 text-slate-500 shrink-0" />
            <span>Danh mục Học kỳ</span>
          </Button>
          <CreateButton
            onClick={handleOpenCreateModal}
            className="h-10 px-4 text-xs sm:text-sm font-medium whitespace-nowrap shrink-0 shadow-xs"
          >
            Thêm mới kỳ chấm
          </CreateButton>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="p-4 rounded-xl border border-line bg-white shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Tìm kiếm mã đợt / biểu mẫu / phạm vi
            </label>
            <input
              type="text"
              placeholder="VD: HK1_2026_2027, Toàn trường..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9 w-full rounded-lg border border-line bg-white px-3 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand-soft"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Lọc theo học kỳ
            </label>
            <select
              value={semesterFilter}
              onChange={(e) => setSemesterFilter(e.target.value)}
              className="h-9 w-full rounded-lg border border-line bg-white px-3 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand-soft"
            >
              <option value="">Tất cả học kỳ</option>
              {options.semesters?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.semesterName} ({s.academicYear})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Lọc theo trạng thái
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 w-full rounded-lg border border-line bg-white px-3 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand-soft"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="CHUA_MO">Chưa mở</option>
              <option value="DANG_MO">Đang mở</option>
              <option value="VO_HIEU_HOA">Vô hiệu hóa</option>
              <option value="DA_DONG">Đã đóng / Khóa sổ</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="rounded-xl border border-line bg-white overflow-hidden shadow-xs">
        <Table
          columns={columns}
          rows={periods}
          dataSource={periods}
          loading={loading}
          emptyText="Chưa có kỳ chấm ĐRL nào phù hợp."
        />
      </div>

      {/* ========================================================================= */}
      {/* 1. Modal: Thêm mới kỳ chấm */}
      {/* ========================================================================= */}
      <Modal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Thêm mới kỳ đánh giá điểm rèn luyện"
        wide={true}
        footer={
          <>
            <CancelButton onClick={() => setCreateModalOpen(false)}>
              Hủy
            </CancelButton>
            <ConfirmButton
              loading={creating}
              onClick={handleCreatePeriod}
            >
              Lưu kỳ đánh giá
            </ConfirmButton>
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

          {/* Hàng 1: Mã đợt chấm & Học kỳ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Mã đợt đánh giá <span className="text-brand">*</span>
              </label>
              <input
                type="text"
                placeholder="VD: HK1_2026_2027"
                value={createForm.periodCode}
                onChange={(e) => setCreateForm({ ...createForm, periodCode: e.target.value })}
                className="h-10 w-full rounded-lg border border-line bg-white px-3 text-sm font-mono outline-none focus:border-brand focus:ring-2 focus:ring-brand-soft"
              />
              <span className="block mt-1 text-[11px] text-slate-400">
                Mã định danh duy nhất trên toàn hệ thống, không trùng lặp giữa các năm học.
              </span>
              {createErrors.periodCode && (
                <span className="block mt-1 text-xs text-brand">{createErrors.periodCode}</span>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-slate-700">
                  Học kỳ áp dụng <span className="text-brand">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleOpenCreateSemester}
                  className="text-xs text-brand hover:underline font-medium inline-flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="size-3.5" /> Thêm học kỳ mới
                </button>
              </div>
              <select
                value={createForm.semesterId}
                onChange={(e) => {
                  const sId = e.target.value
                  const sem = options.semesters?.find((s) => String(s.id) === String(sId))
                  setCreateForm({
                    ...createForm,
                    semesterId: sId,
                    formVersionId: "",
                    periodCode: sem ? (sem.semesterCode || `HK${sem.id}_${sem.academicYear?.replace("-", "_")}`) : createForm.periodCode,
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
          </div>

          {/* Hàng 2: Biểu mẫu áp dụng & Phạm vi */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Biểu mẫu áp dụng <span className="text-brand">*</span>
              </label>
              <select
                value={createForm.formVersionId}
                onChange={(e) => setCreateForm({ ...createForm, formVersionId: e.target.value })}
                className="h-10 w-full rounded-lg border border-line bg-white px-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand-soft"
                disabled={!createForm.semesterId}
              >
                <option value="">-- Chọn phiên bản biểu mẫu áp dụng --</option>
                {availableFormVersions.map((fv) => (
                  <option key={fv.id} value={fv.id}>
                    {fv.formName} ({fv.formCode} {fv.versionNo})
                  </option>
                ))}
              </select>
              {availableFormVersions.length === 0 && createForm.semesterId && (
                <span className="block mt-1 text-xs text-amber-600">
                  Chưa có phiên bản biểu mẫu có hiệu lực nào cho học kỳ này.
                </span>
              )}
              {createErrors.formVersionId && (
                <span className="block mt-1 text-xs text-brand">{createErrors.formVersionId}</span>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Phạm vi áp dụng <span className="text-brand">*</span>
              </label>
              <select
                value={createForm.applicationScope}
                onChange={(e) => setCreateForm({ ...createForm, applicationScope: e.target.value })}
                className="h-10 w-full rounded-lg border border-line bg-white px-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand-soft"
              >
                <option value="Toàn trường">Toàn trường</option>
                <option value="Theo khoa">Theo khoa cụ thể</option>
              </select>
              {createErrors.applicationScope && (
                <span className="block mt-1 text-xs text-brand">{createErrors.applicationScope}</span>
              )}
            </div>
          </div>

          {/* Khoa áp dụng (khi chọn Theo khoa) */}
          {createForm.applicationScope === "Theo khoa" && (
            <div className="p-3 rounded-lg bg-slate-50 border border-line space-y-2">
              <label className="block text-xs font-medium text-slate-700">
                Chọn các Khoa áp dụng <span className="text-brand">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {options.departments?.map((dept) => {
                  const checked = createForm.applicableDepartmentIds.includes(String(dept.id))
                  return (
                    <label key={dept.id} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          const newIds = e.target.checked
                            ? [...createForm.applicableDepartmentIds, String(dept.id)]
                            : createForm.applicableDepartmentIds.filter((id) => id !== String(dept.id))
                          setCreateForm({ ...createForm, applicableDepartmentIds: newIds })
                        }}
                        className="rounded border-slate-300 text-brand focus:ring-brand"
                      />
                      <span>{dept.deptName}</span>
                    </label>
                  )
                })}
              </div>
              {createErrors.applicableDepartmentIds && (
                <span className="block text-xs text-brand">{createErrors.applicableDepartmentIds}</span>
              )}
            </div>
          )}

          {/* Khối cấu hình 4 mốc thời gian tuần tự */}
          <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/70 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
              <Clock className="size-4 text-brand" />
              Thiết lập các mốc thời hạn đánh giá
            </div>
            <p className="text-[11px] text-slate-500">
              Thứ tự thời gian tuần tự: <strong>Ngày mở cổng &lt; Hạn SV nộp &lt; Hạn Lớp duyệt &lt; Hạn Khoa duyệt</strong>
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  1. Ngày mở cổng tự chấm <span className="text-brand">*</span>
                </label>
                <input
                  type="date"
                  value={createForm.startDate}
                  onChange={(e) => setCreateForm({ ...createForm, startDate: e.target.value })}
                  className="h-9 w-full rounded-lg border border-line bg-white px-2.5 text-xs outline-none focus:border-brand"
                />
                {createErrors.startDate && (
                  <span className="block mt-1 text-[11px] text-brand">{createErrors.startDate}</span>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  2. Hạn sinh viên nộp bài <span className="text-brand">*</span>
                </label>
                <input
                  type="date"
                  value={createForm.studentDeadline}
                  onChange={(e) => setCreateForm({ ...createForm, studentDeadline: e.target.value })}
                  className="h-9 w-full rounded-lg border border-line bg-white px-2.5 text-xs outline-none focus:border-brand"
                />
                {createErrors.studentDeadline && (
                  <span className="block mt-1 text-[11px] text-brand">{createErrors.studentDeadline}</span>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  3. Hạn ban cán sự lớp thẩm định <span className="text-brand">*</span>
                </label>
                <input
                  type="date"
                  value={createForm.classDeadline}
                  onChange={(e) => setCreateForm({ ...createForm, classDeadline: e.target.value })}
                  className="h-9 w-full rounded-lg border border-line bg-white px-2.5 text-xs outline-none focus:border-brand"
                />
                {createErrors.classDeadline && (
                  <span className="block mt-1 text-[11px] text-brand">{createErrors.classDeadline}</span>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  4. Hạn cấp khoa phê duyệt <span className="text-brand">*</span>
                </label>
                <input
                  type="date"
                  value={createForm.deanDeadline}
                  onChange={(e) => setCreateForm({ ...createForm, deanDeadline: e.target.value })}
                  className="h-9 w-full rounded-lg border border-line bg-white px-2.5 text-xs outline-none focus:border-brand"
                />
                {createErrors.deanDeadline && (
                  <span className="block mt-1 text-[11px] text-brand">{createErrors.deanDeadline}</span>
                )}
              </div>
            </div>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* 1.1 Modal: Chỉnh sửa kỳ chấm (khi ở trạng thái Chưa mở) */}
      {/* ========================================================================= */}
      <Modal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title={`Chỉnh sửa đợt đánh giá: ${selectedPeriod?.periodCode || ""}`}
        wide={true}
        footer={
          <>
            <CancelButton onClick={() => setEditModalOpen(false)}>
              Hủy
            </CancelButton>
            <ConfirmButton
              loading={updating}
              onClick={handleUpdatePeriod}
            >
              Lưu thay đổi
            </ConfirmButton>
          </>
        }
      >
        <form onSubmit={handleUpdatePeriod} className="space-y-4">
          {editErrors.form && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700 flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0 text-rose-600" />
              <span>{editErrors.form}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Mã đợt đánh giá <span className="text-brand">*</span>
              </label>
              <input
                type="text"
                value={editForm.periodCode}
                onChange={(e) => setEditForm({ ...editForm, periodCode: e.target.value })}
                className="h-10 w-full rounded-lg border border-line bg-white px-3 text-sm font-mono outline-none focus:border-brand"
              />
              {editErrors.periodCode && (
                <span className="block mt-1 text-xs text-brand">{editErrors.periodCode}</span>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Học kỳ áp dụng <span className="text-brand">*</span>
              </label>
              <select
                value={editForm.semesterId}
                onChange={(e) => setEditForm({ ...editForm, semesterId: e.target.value, formVersionId: "" })}
                className="h-10 w-full rounded-lg border border-line bg-white px-3 text-sm outline-none focus:border-brand"
              >
                <option value="">-- Chọn học kỳ --</option>
                {options.semesters?.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.semesterName} ({s.academicYear})
                  </option>
                ))}
              </select>
              {editErrors.semesterId && (
                <span className="block mt-1 text-xs text-brand">{editErrors.semesterId}</span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Biểu mẫu áp dụng <span className="text-brand">*</span>
              </label>
              <select
                value={editForm.formVersionId}
                onChange={(e) => setEditForm({ ...editForm, formVersionId: e.target.value })}
                className="h-10 w-full rounded-lg border border-line bg-white px-3 text-sm outline-none focus:border-brand"
              >
                <option value="">-- Chọn phiên bản biểu mẫu áp dụng --</option>
                {availableFormVersionsForEdit.map((fv) => (
                  <option key={fv.id} value={fv.id}>
                    {fv.formName} ({fv.formCode} {fv.versionNo})
                  </option>
                ))}
              </select>
              {editErrors.formVersionId && (
                <span className="block mt-1 text-xs text-brand">{editErrors.formVersionId}</span>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Phạm vi áp dụng <span className="text-brand">*</span>
              </label>
              <select
                value={editForm.applicationScope}
                onChange={(e) => setEditForm({ ...editForm, applicationScope: e.target.value })}
                className="h-10 w-full rounded-lg border border-line bg-white px-3 text-sm outline-none focus:border-brand"
              >
                <option value="Toàn trường">Toàn trường</option>
                <option value="Theo khoa">Theo khoa cụ thể</option>
              </select>
            </div>
          </div>

          {editForm.applicationScope === "Theo khoa" && (
            <div className="p-3 rounded-lg bg-slate-50 border border-line space-y-2">
              <label className="block text-xs font-medium text-slate-700">
                Khoa áp dụng <span className="text-brand">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {options.departments?.map((dept) => {
                  const checked = editForm.applicableDepartmentIds.includes(String(dept.id))
                  return (
                    <label key={dept.id} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          const newIds = e.target.checked
                            ? [...editForm.applicableDepartmentIds, String(dept.id)]
                            : editForm.applicableDepartmentIds.filter((id) => id !== String(dept.id))
                          setEditForm({ ...editForm, applicableDepartmentIds: newIds })
                        }}
                        className="rounded border-slate-300 text-brand"
                      />
                      <span>{dept.deptName}</span>
                    </label>
                  )
                })}
              </div>
              {editErrors.applicableDepartmentIds && (
                <span className="block text-xs text-brand">{editErrors.applicableDepartmentIds}</span>
              )}
            </div>
          )}

          {/* 4 Mốc thời gian */}
          <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/70 space-y-3">
            <div className="text-xs font-semibold text-slate-800">
              Cập nhật các mốc thời hạn đánh giá
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">1. Ngày mở cổng</label>
                <input
                  type="date"
                  value={editForm.startDate}
                  onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
                  className="h-9 w-full rounded-lg border border-line bg-white px-2.5 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">2. Hạn SV nộp bài</label>
                <input
                  type="date"
                  value={editForm.studentDeadline}
                  onChange={(e) => setEditForm({ ...editForm, studentDeadline: e.target.value })}
                  className="h-9 w-full rounded-lg border border-line bg-white px-2.5 text-xs"
                />
                {editErrors.studentDeadline && (
                  <span className="block mt-1 text-[11px] text-brand">{editErrors.studentDeadline}</span>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">3. Hạn Lớp thẩm định</label>
                <input
                  type="date"
                  value={editForm.classDeadline}
                  onChange={(e) => setEditForm({ ...editForm, classDeadline: e.target.value })}
                  className="h-9 w-full rounded-lg border border-line bg-white px-2.5 text-xs"
                />
                {editErrors.classDeadline && (
                  <span className="block mt-1 text-[11px] text-brand">{editErrors.classDeadline}</span>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">4. Hạn Khoa phê duyệt</label>
                <input
                  type="date"
                  value={editForm.deanDeadline}
                  onChange={(e) => setEditForm({ ...editForm, deanDeadline: e.target.value })}
                  className="h-9 w-full rounded-lg border border-line bg-white px-2.5 text-xs"
                />
                {editErrors.deanDeadline && (
                  <span className="block mt-1 text-[11px] text-brand">{editErrors.deanDeadline}</span>
                )}
              </div>
            </div>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* 2. Modal: Xem chi tiết & Lịch sử thay đổi (R) */}
      {/* ========================================================================= */}
      <Modal
        open={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title={`Chi tiết kỳ chấm: ${periodDetail?.periodCode || selectedPeriod?.periodCode || ""}`}
        wide={true}
        footer={
          <Button variant="secondary" onClick={() => setDetailModalOpen(false)}>
            Đóng
          </Button>
        }
      >
        {detailLoading ? (
          <div className="py-12 text-center text-sm text-slate-400">Đang tải chi tiết...</div>
        ) : periodDetail ? (
          <div className="space-y-5">
            {/* Thẻ thông tin chung */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl border border-line bg-slate-50/50">
              <div>
                <div className="text-xs text-muted">Học kỳ</div>
                <div className="text-sm font-semibold text-ink mt-0.5">{periodDetail.semesterName}</div>
                <div className="text-xs text-muted">Năm học {periodDetail.academicYear}</div>
              </div>
              <div>
                <div className="text-xs text-muted">Biểu mẫu áp dụng</div>
                <div className="text-sm font-semibold text-ink mt-0.5">{periodDetail.formName}</div>
                <div className="text-xs text-muted font-mono">{periodDetail.formCode} ({periodDetail.formVersionNo})</div>
              </div>
              <div>
                <div className="text-xs text-muted">Phạm vi áp dụng</div>
                <div className="text-sm font-semibold text-ink mt-0.5">{periodDetail.applicationScope}</div>
                {periodDetail.applicableDepartmentNames?.length > 0 && (
                  <div className="text-xs text-muted">{periodDetail.applicableDepartmentNames.join(", ")}</div>
                )}
              </div>
              <div>
                <div className="text-xs text-muted">Trạng thái</div>
                <div className="mt-1">{renderStatusBadge(periodDetail.status, periodDetail.isLocked)}</div>
              </div>
            </div>

            {/* Tiến độ 3 mốc thời hạn */}
            <div className="p-4 rounded-xl border border-line bg-white space-y-2">
              <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Lịch trình thời hạn các cấp
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-center">
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="text-[11px] text-muted">1. Mở cổng</div>
                  <div className="text-xs font-bold text-slate-800 mt-0.5">{formatDate(periodDetail.startDate)}</div>
                </div>
                <div className="p-2.5 rounded-lg bg-amber-50/60 border border-amber-200">
                  <div className="text-[11px] text-amber-700 font-medium">2. Sinh viên nộp</div>
                  <div className="text-xs font-bold text-amber-900 mt-0.5">{formatDate(periodDetail.studentDeadline || periodDetail.submissionDeadline)}</div>
                </div>
                <div className="p-2.5 rounded-lg bg-blue-50/60 border border-blue-200">
                  <div className="text-[11px] text-blue-700 font-medium">3. Lớp thẩm định</div>
                  <div className="text-xs font-bold text-blue-900 mt-0.5">{formatDate(periodDetail.classDeadline)}</div>
                </div>
                <div className="p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-200">
                  <div className="text-[11px] text-emerald-700 font-medium">4. Khoa phê duyệt</div>
                  <div className="text-xs font-bold text-emerald-900 mt-0.5">{formatDate(periodDetail.deanDeadline)}</div>
                </div>
              </div>
            </div>

            {/* Bảng tóm tắt tiến độ nộp phiếu */}
            <div className="p-4 rounded-xl border border-line bg-white shadow-xs">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2.5">
                Tiến độ nộp & phê duyệt phiếu ĐRL
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
                <div className="p-2 rounded-lg bg-slate-50 border border-line">
                  <div className="text-[11px] text-muted">Tổng phiếu</div>
                  <div className="text-base font-bold text-ink mt-0.5">{periodDetail.totalSubmissions || 0}</div>
                </div>
                <div className="p-2 rounded-lg bg-amber-50/70 border border-amber-200">
                  <div className="text-[11px] text-amber-700 font-medium">Đang duyệt</div>
                  <div className="text-base font-bold text-amber-800 mt-0.5">{periodDetail.pendingSubmissions || 0}</div>
                </div>
                <div className="p-2 rounded-lg bg-emerald-50/70 border border-emerald-200">
                  <div className="text-[11px] text-emerald-700 font-medium">Khoa đã duyệt</div>
                  <div className="text-base font-bold text-emerald-800 mt-0.5">{periodDetail.completedSubmissions || 0}</div>
                </div>
                <div className="p-2 rounded-lg bg-slate-100 border border-slate-300">
                  <div className="text-[11px] text-slate-600 font-medium">Bản nháp chưa nộp</div>
                  <div className="text-base font-bold text-slate-700 mt-0.5">{periodDetail.draftSubmissions || 0}</div>
                </div>
                <div className="p-2 rounded-lg bg-rose-50 border border-rose-200">
                  <div className="text-[11px] text-rose-700 font-medium">Bị trả lại</div>
                  <div className="text-base font-bold text-rose-800 mt-0.5">{periodDetail.rejectedSubmissions || 0}</div>
                </div>
              </div>
            </div>

            {/* Danh sách ngoại lệ mở lẻ */}
            {periodDetail.exceptions && parseExceptionsList(periodDetail.exceptions).length > 0 && (
              <div className="p-4 rounded-xl border border-line bg-white space-y-2">
                <div className="text-xs font-semibold text-slate-700">
                  Danh sách đơn vị được cấp quyền ngoại lệ:
                </div>
                <div className="space-y-1.5">
                  {parseExceptionsList(periodDetail.exceptions).map((ex, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-slate-50 border border-line text-xs flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-slate-800">
                          [{ex.targetType === "CLASS" ? "Lớp" : "Khoa"}] {ex.targetName}
                        </span>
                        <span className="text-muted ml-2">Hạn mở lẻ: {formatDate(ex.deadline)}</span>
                        {ex.reason && <div className="text-slate-500 text-[11px] mt-0.5">Lý do: {ex.reason}</div>}
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Ngoại lệ hợp lệ
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Audit Logs Section */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Clock className="size-4 text-slate-400" />
                <h3 className="text-sm font-semibold text-slate-800">Nhật ký theo dõi (Audit Log)</h3>
              </div>
              <div className="rounded-xl border border-line bg-white divide-y divide-line overflow-hidden">
                {periodDetail.history && periodDetail.history.length > 0 ? (
                  periodDetail.history.map((log) => (
                    <div key={log.id} className="p-3 text-xs flex items-start justify-between hover:bg-slate-50/50">
                      <div className="space-y-1">
                        <div className="font-medium text-slate-800 flex items-center gap-2">
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[11px] font-mono text-slate-700 border border-slate-200">
                            {log.actionDisplayName}
                          </span>
                          <span className="text-slate-400">•</span>
                          <span>Bởi: <strong>{log.actorName}</strong></span>
                        </div>
                        {log.note && <p className="text-slate-600">{log.note}</p>}
                      </div>
                      <span className="text-[11px] text-slate-400 whitespace-nowrap ml-4">
                        {log.createdAt ? new Date(log.createdAt).toLocaleString("vi-VN") : "–"}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="py-6 text-center text-xs text-slate-400">Chưa có nhật ký ghi nhận.</div>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </Modal>

      {/* ========================================================================= */}
      {/* 3. Modal: Gia hạn / Cấu hình ngoại lệ */}
      {/* ========================================================================= */}
      <Modal
        open={extendModalOpen}
        onClose={() => setExtendModalOpen(false)}
        title={`Gia hạn thời hạn & Cấp quyền ngoại lệ: ${selectedPeriod?.periodCode || ""}`}
        wide={true}
        footer={
          <>
            <CancelButton onClick={() => setExtendModalOpen(false)}>
              Hủy
            </CancelButton>
            <ConfirmButton
              loading={extending}
              onClick={handleConfirmExtendDeadline}
            >
              Lưu cấu hình
            </ConfirmButton>
          </>
        }
      >
        <form onSubmit={handleConfirmExtendDeadline} className="space-y-4">
          {extendError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700 flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0 text-rose-600" />
              <span>{extendError}</span>
            </div>
          )}

          {/* Chọn phạm vi gia hạn */}
          <div className="flex items-center gap-4 p-3 rounded-lg bg-slate-50 border border-line">
            <span className="text-xs font-semibold text-slate-700">Hình thức:</span>
            <label className="flex items-center gap-2 text-xs text-slate-800 cursor-pointer">
              <input
                type="radio"
                name="extendScope"
                value="ALL"
                checked={extendForm.extendScope === "ALL"}
                onChange={() => setExtendForm({ ...extendForm, extendScope: "ALL" })}
                className="text-brand focus:ring-brand"
              />
              <span>Gia hạn chung (Toàn trường)</span>
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-800 cursor-pointer">
              <input
                type="radio"
                name="extendScope"
                value="EXCEPTION"
                checked={extendForm.extendScope === "EXCEPTION"}
                onChange={() => setExtendForm({ ...extendForm, extendScope: "EXCEPTION" })}
                className="text-brand focus:ring-brand"
              />
              <span>Cấp quyền mở nộp/sửa bổ sung (Theo từng Lớp/Khoa)</span>
            </label>
          </div>

          {/* Trường hợp 1: Gia hạn chung */}
          {extendForm.extendScope === "ALL" && (
            <div className="space-y-3 p-3.5 rounded-lg border border-line bg-white">
              <div className="text-xs text-slate-600">
                Điều chỉnh các mốc thời hạn đánh giá chung cho toàn trường:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    1. Hạn SV nộp bài mới <span className="text-brand">*</span>
                  </label>
                  <input
                    type="date"
                    value={extendForm.newStudentDeadline}
                    min={selectedPeriod?.studentDeadline || new Date().toISOString().split("T")[0]}
                    onChange={(e) => setExtendForm({ ...extendForm, newStudentDeadline: e.target.value })}
                    className="h-9 w-full rounded-lg border border-line bg-white px-2.5 text-xs outline-none focus:border-brand"
                  />
                  <span className="block mt-1 text-[11px] text-muted">
                    Hiện tại: {formatDate(selectedPeriod?.studentDeadline || selectedPeriod?.submissionDeadline)}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    2. Hạn Lớp thẩm định mới
                  </label>
                  <input
                    type="date"
                    value={extendForm.newClassDeadline}
                    min={extendForm.newStudentDeadline}
                    onChange={(e) => setExtendForm({ ...extendForm, newClassDeadline: e.target.value })}
                    className="h-9 w-full rounded-lg border border-line bg-white px-2.5 text-xs outline-none focus:border-brand"
                  />
                  <span className="block mt-1 text-[11px] text-muted">
                    Hiện tại: {formatDate(selectedPeriod?.classDeadline)}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    3. Hạn Khoa phê duyệt mới
                  </label>
                  <input
                    type="date"
                    value={extendForm.newDeanDeadline}
                    min={extendForm.newClassDeadline}
                    onChange={(e) => setExtendForm({ ...extendForm, newDeanDeadline: e.target.value })}
                    className="h-9 w-full rounded-lg border border-line bg-white px-2.5 text-xs outline-none focus:border-brand"
                  />
                  <span className="block mt-1 text-[11px] text-muted">
                    Hiện tại: {formatDate(selectedPeriod?.deanDeadline)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Trường hợp 2: Cấp quyền mở lẻ ngoại lệ */}
          {extendForm.extendScope === "EXCEPTION" && (
            <div className="space-y-3 p-3.5 rounded-lg border border-line bg-white">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Đối tượng cấp ngoại lệ <span className="text-brand">*</span>
                  </label>
                  <div className="flex gap-4 mb-2">
                    <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                      <input
                        type="radio"
                        name="targetType"
                        value="CLASS"
                        checked={extendForm.targetType === "CLASS"}
                        onChange={() => setExtendForm({ ...extendForm, targetType: "CLASS", targetId: options.classes?.[0]?.id || "" })}
                      />
                      <span>Theo Lớp</span>
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                      <input
                        type="radio"
                        name="targetType"
                        value="DEPARTMENT"
                        checked={extendForm.targetType === "DEPARTMENT"}
                        onChange={() => setExtendForm({ ...extendForm, targetType: "DEPARTMENT", targetId: options.departments?.[0]?.id || "" })}
                      />
                      <span>Theo Khoa</span>
                    </label>
                  </div>

                  <select
                    value={extendForm.targetId}
                    onChange={(e) => setExtendForm({ ...extendForm, targetId: e.target.value })}
                    className="h-9 w-full rounded-lg border border-line bg-white px-2.5 text-xs outline-none focus:border-brand"
                  >
                    {extendForm.targetType === "CLASS" ? (
                      options.classes?.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.className} ({c.classCode})
                        </option>
                      ))
                    ) : (
                      options.departments?.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.deptName} ({d.deptCode})
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Thời hạn mở nộp/sửa lẻ <span className="text-brand">*</span>
                  </label>
                  <input
                    type="date"
                    value={extendForm.exceptionDeadline}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={(e) => setExtendForm({ ...extendForm, exceptionDeadline: e.target.value })}
                    className="h-9 w-full rounded-lg border border-line bg-white px-2.5 text-xs outline-none focus:border-brand"
                  />
                  <span className="block mt-1 text-[11px] text-muted">
                    Thời điểm kết thúc đợt mở lẻ cho đơn vị đặc thù này.
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Lý do mở lẻ ngoại lệ
                </label>
                <input
                  type="text"
                  placeholder="VD: Lớp đi thực tế tốt nghiệp về muộn..."
                  value={extendForm.reason}
                  onChange={(e) => setExtendForm({ ...extendForm, reason: e.target.value })}
                  className="h-9 w-full rounded-lg border border-line bg-white px-2.5 text-xs outline-none focus:border-brand"
                />
              </div>
            </div>
          )}
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* 4. Modal: Xác nhận Mở / Kích hoạt kỳ */}
      {/* ========================================================================= */}
      <Modal
        open={openConfirmModalOpen}
        onClose={() => setOpenConfirmModalOpen(false)}
        title={selectedPeriod?.status === "VO_HIEU_HOA" ? "Kích hoạt lại đợt đánh giá điểm rèn luyện" : "Kích hoạt mở đợt đánh giá điểm rèn luyện"}
        wide={false}
        footer={
          <>
            <CancelButton onClick={() => setOpenConfirmModalOpen(false)}>
              Hủy
            </CancelButton>
            <ConfirmButton
              loading={actionLoading}
              onClick={handleConfirmOpenPeriod}
            >
              {selectedPeriod?.status === "VO_HIEU_HOA" ? "Xác nhận kích hoạt lại" : "Xác nhận mở đợt"}
            </ConfirmButton>
          </>
        }
      >
        <div className="space-y-3 text-sm text-slate-700">
          <p>
            Bạn có chắc chắn muốn {selectedPeriod?.status === "VO_HIEU_HOA" ? "kích hoạt lại" : "kích hoạt mở"} đợt đánh giá{" "}
            <span className="font-semibold text-slate-900">{selectedPeriod?.periodCode}</span> (Học kỳ: {selectedPeriod?.semesterName})?
          </p>
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold">
              <CheckCircle2 className="size-4 text-emerald-600" />
              Quy trình sau khi kích hoạt:
            </div>
            <ul className="list-disc pl-5 space-y-0.5 text-emerald-700">
              <li>Chuyển trạng thái đợt đánh giá sang <strong>Đang mở</strong>.</li>
              <li>Kích hoạt cổng tự đánh giá cho toàn bộ sinh viên thuộc phạm vi áp dụng.</li>
              <li>Gửi thông báo tự động (In-app và Email) đến Sinh viên, Cán bộ Lớp và Lãnh đạo Khoa.</li>
              <li>Lưu ý: Hệ thống chỉ duy trì duy nhất 01 đợt đánh giá đang mở tại cùng một thời điểm.</li>
            </ul>
          </div>
        </div>
      </Modal>

      {/* ========================================================================= */}
      {/* 5. Modal: Khóa sổ / Đóng kỳ */}
      {/* ========================================================================= */}
      <Modal
        open={closeConfirmModalOpen}
        onClose={() => setCloseConfirmModalOpen(false)}
        title={`Khóa sổ & Kết thúc đợt đánh giá: ${selectedPeriod?.periodCode || ""}`}
        wide={true}
        footer={
          <>
            <CancelButton onClick={() => setCloseConfirmModalOpen(false)}>
              Hủy
            </CancelButton>
            <Button
              variant="danger"
              loading={actionLoading}
              onClick={handleConfirmClosePeriod}
            >
              <Lock className="size-4 mr-1.5" />
              Xác nhận Khóa sổ
            </Button>
          </>
        }
      >
        <div className="space-y-4 text-sm text-slate-700">
          <p>
            Bạn đang chuẩn bị thực hiện <strong>Khóa sổ đợt đánh giá</strong>. Toàn bộ tiến độ và kết quả đánh giá sẽ được niêm phong chính thức. Vui lòng kiểm tra kỹ số liệu trước khi xác nhận:
          </p>

          {/* Bảng tổng hợp tiến độ */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl border border-line bg-slate-50 text-center">
            <div className="p-2.5 rounded-lg bg-white border border-line">
              <div className="text-[11px] text-muted">Tổng số phiếu</div>
              <div className="text-lg font-bold text-ink mt-0.5">{selectedPeriod?.totalSubmissions || 0}</div>
            </div>
            <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200">
              <div className="text-[11px] text-emerald-700 font-semibold">Đã duyệt hoàn tất</div>
              <div className="text-lg font-bold text-emerald-800 mt-0.5">{selectedPeriod?.completedSubmissions || 0}</div>
            </div>
            <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200">
              <div className="text-[11px] text-amber-700 font-semibold">Đang chờ duyệt</div>
              <div className="text-lg font-bold text-amber-800 mt-0.5">{selectedPeriod?.pendingSubmissions || 0}</div>
            </div>
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200">
              <div className="text-[11px] text-rose-700 font-semibold">Bản nháp chưa nộp</div>
              <div className="text-lg font-bold text-rose-800 mt-0.5">{selectedPeriod?.draftSubmissions || 0}</div>
            </div>
          </div>

          {/* Cảnh báo quy trình Khóa sổ */}
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-amber-800">
              <AlertCircle className="size-4 text-amber-600 shrink-0" />
              Quy trình xử lý khóa sổ & niêm phong dữ liệu:
            </div>
            <ol className="list-decimal pl-5 space-y-1 text-amber-800">
              <li>Chuyển trạng thái đợt đánh giá sang <strong>Đã đóng / Khóa sổ</strong>.</li>
              <li>Đóng cổng đánh giá: Ngừng toàn bộ thao tác soạn, sửa, thẩm định và phê duyệt trên toàn hệ thống.</li>
              <li>
                <strong>Tất cả bản nháp chưa nộp</strong> trước hạn sẽ tự động chuyển sang <strong>Hết hạn</strong> (hệ thống mặc định gán 0 điểm và xếp loại Kém).
              </li>
              <li>Niêm phong kết quả đánh giá chính thức của học kỳ.</li>
              <li>
                Sẵn sàng kết nối và đồng bộ dữ liệu điểm tổng hợp sang <strong>Hệ thống Quản lý Đào tạo (SIS) của Nhà trường</strong>.
              </li>
            </ol>
          </div>
        </div>
      </Modal>

      {/* ========================================================================= */}
      {/* 5.1. Modal: Xác nhận Vô hiệu hóa kỳ đánh giá */}
      {/* ========================================================================= */}
      <Modal
        open={deactivateConfirmModalOpen}
        onClose={() => setDeactivateConfirmModalOpen(false)}
        title="Xác nhận vô hiệu hóa kỳ đánh giá"
        wide={false}
        footer={
          <>
            <CancelButton onClick={() => setDeactivateConfirmModalOpen(false)}>
              Hủy
            </CancelButton>
            <Button
              variant="danger"
              loading={deactivating}
              onClick={handleConfirmDeactivatePeriod}
            >
              <Ban className="size-4 mr-1.5" />
              Xác nhận vô hiệu hóa
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-sm text-slate-700">
          <p>
            Bạn có chắc chắn muốn vô hiệu hóa kỳ đánh giá{" "}
            <span className="font-semibold text-slate-900">{selectedPeriod?.periodCode}</span>?
          </p>
          <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-rose-900">
              <AlertCircle className="size-4 text-rose-600 shrink-0" />
              Lưu ý quan trọng:
            </div>
            <ul className="list-disc pl-5 space-y-1 text-rose-700">
              <li>Hệ thống lưu trữ toàn vẹn lịch sử đánh giá và hồ sơ sinh viên, <strong>tuyệt đối không xóa bỏ dữ liệu</strong>.</li>
              <li>Sinh viên và các cấp đánh giá sẽ tạm thời không thể thao tác trên kỳ đánh giá này.</li>
              <li>Bạn có thể <strong>kích hoạt lại</strong> kỳ đánh giá bất kỳ lúc nào khi cần tiếp tục triển khai.</li>
            </ul>
          </div>
        </div>
      </Modal>

      {/* ========================================================================= */}
      {/* 6. Modal: Quản lý danh mục Học kỳ */}
      {/* ========================================================================= */}
      <Modal
        open={semesterManagerOpen}
        onClose={() => setSemesterManagerOpen(false)}
        title="Quản lý Danh mục Học kỳ"
        wide={true}
        footer={
          <Button variant="secondary" onClick={() => setSemesterManagerOpen(false)}>
            Đóng
          </Button>
        }
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Danh sách các học kỳ trong hệ thống.
            </p>
            <Button variant="primary" onClick={handleOpenCreateSemester}>
              <Plus className="size-3.5 mr-1" />
              Thêm học kỳ mới
            </Button>
          </div>

          <div className="rounded-xl border border-line bg-white divide-y divide-line overflow-hidden max-h-[380px] overflow-y-auto">
            {semesterListLoading ? (
              <div className="py-8 text-center text-xs text-slate-400">Đang tải danh sách học kỳ...</div>
            ) : semesterList.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">Chưa có học kỳ nào.</div>
            ) : (
              semesterList.map((sem) => (
                <div key={sem.id} className="p-3 text-xs flex items-center justify-between hover:bg-slate-50">
                  <div className="space-y-0.5">
                    <div className="font-semibold text-slate-800 flex items-center gap-2">
                      <span>{sem.semesterName}</span>
                      <span className="font-mono text-[11px] text-slate-500 bg-slate-100 px-1 rounded border border-slate-200">
                        {sem.semesterCode}
                      </span>
                      {sem.isActive && (
                        <span className="px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 font-semibold text-[10px] border border-emerald-200">
                          Đang kích hoạt
                        </span>
                      )}
                    </div>
                    <div className="text-slate-500 text-[11px]">
                      Năm học: <strong>{sem.academicYear}</strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <IconButton
                      label="Chỉnh sửa"
                      onClick={() => handleOpenEditSemester(sem)}
                      className="text-brand hover:bg-brand-soft"
                    >
                      <Pencil className="size-3.5" />
                    </IconButton>
                    <IconButton
                      label="Xóa"
                      onClick={() => handleDeleteSemester(sem.id, sem.semesterName)}
                      className="text-rose-600 hover:bg-rose-50"
                    >
                      <Trash2 className="size-3.5" />
                    </IconButton>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>

      {/* ========================================================================= */}
      {/* 7. Modal: Thêm / Chỉnh sửa Học kỳ */}
      {/* ========================================================================= */}
      <Modal
        open={semesterFormModalOpen}
        onClose={() => setSemesterFormModalOpen(false)}
        title={semesterForm.id ? "Chỉnh sửa Học kỳ" : "Thêm mới Học kỳ"}
        wide={false}
        footer={
          <>
            <CancelButton onClick={() => setSemesterFormModalOpen(false)}>
              Hủy
            </CancelButton>
            <ConfirmButton
              loading={semesterSaving}
              onClick={handleSaveSemester}
            >
              Lưu học kỳ
            </ConfirmButton>
          </>
        }
      >
        <form onSubmit={handleSaveSemester} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Mã học kỳ <span className="text-brand">*</span>
            </label>
            <input
              type="text"
              placeholder="VD: HK1_2026_2027"
              value={semesterForm.semesterCode}
              onChange={(e) => setSemesterForm({ ...semesterForm, semesterCode: e.target.value })}
              className="h-9 w-full rounded-lg border border-line bg-white px-3 text-sm font-mono outline-none focus:border-brand"
            />
            {semesterErrors.semesterCode && (
              <span className="block mt-1 text-xs text-brand">{semesterErrors.semesterCode}</span>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Tên học kỳ <span className="text-brand">*</span>
            </label>
            <input
              type="text"
              placeholder="VD: Học kỳ 1 Năm 2026-2027"
              value={semesterForm.semesterName}
              onChange={(e) => setSemesterForm({ ...semesterForm, semesterName: e.target.value })}
              className="h-9 w-full rounded-lg border border-line bg-white px-3 text-sm outline-none focus:border-brand"
            />
            {semesterErrors.semesterName && (
              <span className="block mt-1 text-xs text-brand">{semesterErrors.semesterName}</span>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Năm học <span className="text-brand">*</span>
            </label>
            <input
              type="text"
              placeholder="VD: 2026-2027"
              value={semesterForm.academicYear}
              onChange={(e) => setSemesterForm({ ...semesterForm, academicYear: e.target.value })}
              className="h-9 w-full rounded-lg border border-line bg-white px-3 text-sm outline-none focus:border-brand"
            />
            {semesterErrors.academicYear && (
              <span className="block mt-1 text-xs text-brand">{semesterErrors.academicYear}</span>
            )}
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isActiveSemester"
              checked={semesterForm.isActive}
              onChange={(e) => setSemesterForm({ ...semesterForm, isActive: e.target.checked })}
              className="rounded border-slate-300 text-brand focus:ring-brand"
            />
            <label htmlFor="isActiveSemester" className="text-xs text-slate-700 cursor-pointer">
              Đặt làm học kỳ hiện tại (Kích hoạt)
            </label>
          </div>
        </form>
      </Modal>
    </div>
  )
}
