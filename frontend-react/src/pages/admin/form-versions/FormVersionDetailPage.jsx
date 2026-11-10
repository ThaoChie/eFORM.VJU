import {
  ArrowLeft,
  Eye,
  Pencil,
  History,
  CheckCircle,
  CircleOff,
  Clock,
  FileText,
  Layers,
  Code2,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Calendar,
  Award
} from "lucide-react"
import React, { useEffect, useState, useMemo } from "react"
import { useNavigate, useParams, Link } from "react-router-dom"
import { toast } from "react-hot-toast"
import {
  BackButton,
  Button,
  Card,
  IconButton,
  Modal,
  PageTitle,
} from "../../../components/ui/Primitives"
import Renderer from "../../../components/form-builder/Renderer"
import { formService } from "../../../services/form-service"
import { extractFieldsAndSlotsFromTemplate } from "./formVersionUtils"

const formatDate = (dateStr, includeTime = false) => {
  if (!dateStr) return "—"
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return "—"
  const pad = (n) => n.toString().padStart(2, "0")
  const dateFormatted = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`
  if (!includeTime) return dateFormatted
  return `${dateFormatted} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function FormVersionDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams()

  const [loading, setLoading] = useState(true)
  const [formVersion, setFormVersion] = useState(null)
  const [versionList, setVersionList] = useState([])
  const [loadingVersions, setLoadingVersions] = useState(false)

  // Preview & JSON modals
  const [previewOpen, setPreviewOpen] = useState(false)
  const [jsonModalOpen, setJsonModalOpen] = useState(false)
  const [copiedJson, setCopiedJson] = useState(false)

  // Collapsed states for criteria groups
  const [expandedGroups, setExpandedGroups] = useState({})

  // Fetch form version and versions history
  useEffect(() => {
    let isMounted = true

    const loadData = async () => {
      if (!id) return
      setLoading(true)
      try {
        const data = await formService.getTemplateById(id)
        if (!isMounted) return
        setFormVersion(data)

        // Load version history for this template
        setLoadingVersions(true)
        try {
          const vRes = await formService.getTemplateVersions(id)
          const list = Array.isArray(vRes) ? vRes : vRes?.content || vRes?.data || []
          if (isMounted) {
            setVersionList(list.length > 0 ? list : [data])
          }
        } catch (vErr) {
          console.warn("Không thể tải lịch sử version:", vErr)
          if (isMounted) {
            setVersionList([data])
          }
        } finally {
          if (isMounted) setLoadingVersions(false)
        }
      } catch (err) {
        console.error("Lỗi tải chi tiết phiên bản biểu mẫu:", err)
        toast.error("Không tìm thấy thông tin phiên bản biểu mẫu")
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadData()

    return () => {
      isMounted = false
    }
  }, [id])

  // Parse layout json
  const { parsedLayout, groups, totalMaxScore, totalCriteriaCount } = useMemo(() => {
    if (!formVersion?.templateLayoutJson) {
      return { parsedLayout: null, groups: [], totalMaxScore: 0, totalCriteriaCount: 0 }
    }

    let parsed = null
    try {
      parsed = typeof formVersion.templateLayoutJson === "string"
        ? JSON.parse(formVersion.templateLayoutJson)
        : formVersion.templateLayoutJson
    } catch (e) {
      console.warn("Lỗi parse layout JSON:", e)
    }

    let rawGroups = []
    if (Array.isArray(parsed)) {
      rawGroups = parsed
    } else if (parsed && Array.isArray(parsed.blocks)) {
      rawGroups = parsed.blocks
    }

    let criteriaCount = 0
    let totalScore = 0

    const normalizedGroups = rawGroups.map((g, idx) => {
      const children = Array.isArray(g.children) ? g.children : []
      criteriaCount += children.length
      const groupScore = Number(g.maxScore) || 0
      totalScore += groupScore

      return {
        id: g.id || `group_${idx}`,
        fieldCode: g.fieldCode || `GROUP_${idx + 1}`,
        title: g.title || g.name || `Nhóm tiêu chí ${idx + 1}`,
        maxScore: groupScore,
        children: children.map((c, cIdx) => ({
          id: c.id || `child_${idx}_${cIdx}`,
          fieldCode: c.fieldCode || `CRIT_${idx + 1}_${cIdx + 1}`,
          title: c.title || c.name || `Tiêu chí ${cIdx + 1}`,
          maxScore: Number(c.maxScore) || 0,
          description: c.description || "",
          isRequired: !!c.isRequired,
          step: c.step || 1
        }))
      }
    })

    return {
      parsedLayout: parsed,
      groups: normalizedGroups,
      totalMaxScore: totalScore || 100,
      totalCriteriaCount: criteriaCount
    }
  }, [formVersion])

  // Initialize expanded groups when groups change
  useEffect(() => {
    if (groups.length > 0) {
      const initial = {}
      groups.forEach((g) => {
        initial[g.id] = true
      })
      setExpandedGroups(initial)
    }
  }, [groups])

  const toggleGroup = (groupId) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId]
    }))
  }

  const renderStatusBadge = (status) => {
    switch (status) {
      case "ACTIVE":
        return (
          <div className="inline-flex items-center gap-1.5 text-xs">
            <span className="size-1.5 rounded-full shrink-0 bg-emerald-500" />
            <span className="font-medium text-emerald-700">Hiệu lực</span>
          </div>
        )
      case "INACTIVE":
        return (
          <div className="inline-flex items-center gap-1.5 text-xs">
            <span className="size-1.5 rounded-full shrink-0 bg-rose-500" />
            <span className="font-medium text-rose-700">Vô hiệu hóa</span>
          </div>
        )
      case "EXPIRED":
        return (
          <div className="inline-flex items-center gap-1.5 text-xs">
            <span className="size-1.5 rounded-full shrink-0 bg-slate-400" />
            <span className="text-slate-500">Hết hiệu lực</span>
          </div>
        )
      default:
        return (
          <div className="inline-flex items-center gap-1.5 text-xs">
            <span className="size-1.5 rounded-full shrink-0 bg-amber-500" />
            <span className="font-medium text-amber-700">{status || "Bản nháp"}</span>
          </div>
        )
    }
  }

  const formattedJsonString = useMemo(() => {
    if (!formVersion?.templateLayoutJson) return "{}"
    try {
      const obj = typeof formVersion.templateLayoutJson === "string"
        ? JSON.parse(formVersion.templateLayoutJson)
        : formVersion.templateLayoutJson
      return JSON.stringify(obj, null, 2)
    } catch (e) {
      return String(formVersion.templateLayoutJson)
    }
  }, [formVersion])

  const handleCopyJson = () => {
    navigator.clipboard.writeText(formattedJsonString)
    setCopiedJson(true)
    toast.success("Đã sao chép JSON cấu hình!")
    setTimeout(() => setCopiedJson(false), 2000)
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="inline-block size-8 animate-spin rounded-full border-4 border-brand border-t-transparent mb-3" />
          <p className="text-sm text-slate-500">Đang tải thông tin chi tiết biểu mẫu...</p>
        </div>
      </div>
    )
  }

  if (!formVersion) {
    return (
      <Card className="p-8 text-center">
        <AlertCircle className="mx-auto size-12 text-rose-500 mb-3" />
        <h2 className="text-lg font-semibold text-slate-800 mb-1">
          Không tìm thấy phiên bản biểu mẫu
        </h2>
        <p className="text-sm text-slate-500 mb-4">
          Phiên bản biểu mẫu không tồn tại hoặc đã bị gỡ bỏ khỏi hệ thống.
        </p>
        <Button onClick={() => navigate("/admin/form-versions")}>
          <ArrowLeft className="size-4" />
          Quay lại danh sách
        </Button>
      </Card>
    )
  }

  return (
    <>
      <PageTitle
        title={`Chi tiết phiên bản biểu mẫu: ${formVersion.formCode} (${formVersion.versionNo || "v1.0"})`}
        description="Xem cấu hình chi tiết, danh mục tiêu chí và lịch sử các phiên bản của biểu mẫu đánh giá điểm rèn luyện."
        action={
          <div className="flex items-center gap-2 flex-wrap">
            <BackButton onClick={() => navigate("/admin/form-versions")}>
              Quay lại danh sách
            </BackButton>

            <Button
              variant="secondary"
              onClick={() => setPreviewOpen(true)}
              className="text-brand border-brand hover:bg-brand-soft"
            >
              <Eye className="size-4" />
              Xem trước mẫu phiếu
            </Button>

            <Button
              variant="secondary"
              onClick={() => setJsonModalOpen(true)}
              className="text-slate-700 border-slate-300 hover:bg-slate-50"
            >
              <Code2 className="size-4" />
              Xem JSON
            </Button>

            {formVersion.status !== "INACTIVE" && (
              <Button
                variant="primary"
                onClick={() => navigate(`/admin/form-versions/${id}/edit`)}
              >
                <Pencil className="size-4" />
                Yêu cầu sửa
              </Button>
            )}
          </div>
        }
      />

      <div className="space-y-6 pb-12">
        {/* CARD 1: THÔNG TIN CHUNG (CHỈ XEM / READ-ONLY) */}
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between border-b border-line pb-3">
            <div className="flex items-center gap-2">
              <FileText className="size-5 text-brand" />
              <h2 className="text-base font-semibold text-slate-800">
                Thông tin chung phiên bản biểu mẫu
              </h2>
            </div>
            <div>{renderStatusBadge(formVersion.status)}</div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Biểu mẫu (Mã phôi) */}
            <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-3.5">
              <span className="block text-xs font-medium text-slate-500 mb-1">
                Biểu mẫu (Mã phôi)
              </span>
              <span className="font-semibold text-slate-800 text-sm">
                {formVersion.formCode}
              </span>
            </div>

            {/* Mã phiên bản */}
            <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-3.5">
              <span className="block text-xs font-medium text-slate-500 mb-1">
                Mã phiên bản
              </span>
              <span className="font-mono font-bold text-brand text-sm">
                {formVersion.versionNo || "v1.0"}
              </span>
            </div>

            {/* Học kỳ áp dụng */}
            <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-3.5">
              <span className="block text-xs font-medium text-slate-500 mb-1">
                Học kỳ áp dụng
              </span>
              <span className="font-medium text-slate-800 text-sm">
                {formVersion.semesterName || "Chưa gán học kỳ"}
              </span>
            </div>

            {/* Phạm vi áp dụng */}
            <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-3.5">
              <span className="block text-xs font-medium text-slate-500 mb-1">
                Phạm vi áp dụng
              </span>
              <span className="font-medium text-slate-700 text-sm">
                {formVersion.scope || "Toàn hệ thống"}
              </span>
            </div>

            {/* Tên phiên bản */}
            <div className="sm:col-span-2 rounded-lg border border-slate-100 bg-slate-50/70 p-3.5">
              <span className="block text-xs font-medium text-slate-500 mb-1">
                Tên phiên bản biểu mẫu
              </span>
              <span className="font-semibold text-slate-900 text-sm">
                {formVersion.formName}
              </span>
            </div>

            {/* Thời gian hiệu lực */}
            <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-3.5">
              <span className="block text-xs font-medium text-slate-500 mb-1">
                Thời gian hiệu lực
              </span>
              <span className="text-xs text-slate-700 font-medium">
                {formVersion.effectiveFrom ? formatDate(formVersion.effectiveFrom) : "—"}
                {" → "}
                {formVersion.effectiveTo ? formatDate(formVersion.effectiveTo) : "Vô thời hạn"}
              </span>
            </div>

            {/* Ngày khởi tạo */}
            <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-3.5">
              <span className="block text-xs font-medium text-slate-500 mb-1">
                Thời điểm khởi tạo
              </span>
              <span className="text-xs text-slate-700 font-medium">
                {formatDate(formVersion.createdAt, true)}
              </span>
            </div>
          </div>
        </Card>

        {/* CARD 2: LỊCH SỬ CÁC VERSION CỦA BIỂU MẪU NÀY */}
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between border-b border-line pb-3">
            <div className="flex items-center gap-2">
              <History className="size-5 text-brand" />
              <div>
                <h2 className="text-base font-semibold text-slate-800">
                  Lịch sử các phiên bản của biểu mẫu ({formVersion.formCode})
                </h2>
                <p className="text-xs text-slate-500">
                  Xem lại toàn bộ các version trước đó và hiện tại của biểu mẫu này.
                </p>
              </div>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              Tổng số: {versionList.length} phiên bản
            </span>
          </div>

          <div className="overflow-x-auto rounded-lg border border-line">
            <table className="w-full text-left text-sm">
              <thead className="bg-canvas text-xs uppercase tracking-wider text-muted border-b border-line">
                <tr>
                  <th className="px-4 py-3 font-semibold">STT</th>
                  <th className="px-4 py-3 font-semibold">Mã phiên bản</th>
                  <th className="px-4 py-3 font-semibold">Tên phiên bản</th>
                  <th className="px-4 py-3 font-semibold">Học kỳ áp dụng</th>
                  <th className="px-4 py-3 font-semibold">Trạng thái</th>
                  <th className="px-4 py-3 font-semibold">Ngày tạo</th>
                  <th className="px-4 py-3 font-semibold text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {loadingVersions ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-slate-500">
                      Đang tải lịch sử các phiên bản...
                    </td>
                  </tr>
                ) : versionList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-slate-500">
                      Chưa có phiên bản nào khác
                    </td>
                  </tr>
                ) : (
                  versionList.map((ver, idx) => {
                    const isCurrent = String(ver.id) === String(id)

                    return (
                      <tr
                        key={ver.id || idx}
                        className={`transition-colors ${
                          isCurrent
                            ? "bg-brand-soft/40 font-medium"
                            : "hover:bg-slate-50/80"
                        }`}
                      >
                        <td className="px-4 py-3 text-slate-600">{idx + 1}</td>
                        <td className="px-4 py-3">
                          <span className="font-mono font-bold text-brand text-xs px-2 py-0.5 rounded bg-brand-soft border border-brand/20">
                            {ver.versionNo || "v1.0"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-900 font-medium">
                          {ver.formName}
                          {isCurrent && (
                            <span className="ml-2 inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-800">
                              Đang xem
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {ver.semesterName || formVersion.semesterName || "—"}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {renderStatusBadge(ver.status)}
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                          {formatDate(ver.createdAt, true)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {isCurrent ? (
                            <span className="text-xs text-slate-400 italic">
                              Phiên bản hiện tại
                            </span>
                          ) : (
                            <Button
                              variant="secondary"
                              className="h-8 px-3 text-xs"
                              onClick={() => navigate(`/admin/form-versions/${ver.id}`)}
                            >
                              <Eye className="size-3.5 mr-1 text-slate-600" />
                              Xem phiên bản này
                            </Button>
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* CARD 3: CẤU TRÚC TIÊU CHÍ VÀ THANG ĐIỂM ĐÁNH GIÁ */}
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between border-b border-line pb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Layers className="size-5 text-brand" />
              <div>
                <h2 className="text-base font-semibold text-slate-800">
                  Cấu trúc tiêu chí đánh giá ({groups.length} nhóm tiêu chí / {totalCriteriaCount} tiêu chí)
                </h2>
                <p className="text-xs text-slate-500">
                  Chuẩn hóa theo thang điểm 100 của Quy chế Đánh giá Kết quả Rèn luyện.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 rounded-lg bg-brand-soft px-3 py-1.5 text-xs font-semibold text-brand">
                <Award className="size-4" />
                Tổng điểm tối đa: {totalMaxScore} điểm
              </div>
              <Button
                variant="secondary"
                className="h-8 px-3 text-xs"
                onClick={() => {
                  const allExpanded = Object.values(expandedGroups).every(Boolean)
                  const nextState = {}
                  groups.forEach((g) => {
                    nextState[g.id] = !allExpanded
                  })
                  setExpandedGroups(nextState)
                }}
              >
                {Object.values(expandedGroups).every(Boolean) ? "Thu gọn tất cả" : "Mở rộng tất cả"}
              </Button>
            </div>
          </div>

          {groups.length === 0 ? (
            <div className="p-8 text-center text-slate-500 border border-dashed rounded-lg">
              <p className="text-sm">Chưa có cấu hình nhóm tiêu chí cho phiên bản này.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {groups.map((group, groupIdx) => {
                const isExpanded = expandedGroups[group.id] ?? true

                return (
                  <div
                    key={group.id}
                    className="overflow-hidden rounded-xl border border-line bg-white shadow-sm"
                  >
                    {/* Header nhóm tiêu chí */}
                    <div
                      onClick={() => toggleGroup(group.id)}
                      className="flex cursor-pointer items-center justify-between bg-slate-50/80 px-4 py-3 transition hover:bg-slate-100/70"
                    >
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          className="text-slate-400 hover:text-slate-600"
                        >
                          {isExpanded ? (
                            <ChevronUp className="size-4" />
                          ) : (
                            <ChevronDown className="size-4" />
                          )}
                        </button>
                        <div>
                          <span className="font-semibold text-slate-900 text-sm">
                            {group.title}
                          </span>
                          <span className="ml-2 font-mono text-xs text-slate-400">
                            [{group.fieldCode}]
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="rounded-md bg-brand-soft px-2.5 py-1 font-mono text-xs font-bold text-brand border border-brand/20">
                          Tối đa: {group.maxScore}đ
                        </span>
                        <span className="text-xs text-slate-500">
                          ({group.children.length} tiêu chí)
                        </span>
                      </div>
                    </div>

                    {/* Danh sách tiêu chí con */}
                    {isExpanded && (
                      <div className="border-t border-line">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-canvas/50 text-[11px] uppercase tracking-wider text-muted border-b border-line">
                            <tr>
                              <th className="px-4 py-2.5 font-semibold w-12 text-center">STT</th>
                              <th className="px-4 py-2.5 font-semibold w-28">Mã trường</th>
                              <th className="px-4 py-2.5 font-semibold">Nội dung tiêu chí & Quy chuẩn chấm</th>
                              <th className="px-4 py-2.5 font-semibold w-28 text-center">Điểm tối đa</th>
                              <th className="px-4 py-2.5 font-semibold w-24 text-center">Bắt buộc</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-line/60">
                            {group.children.length === 0 ? (
                              <tr>
                                <td colSpan={5} className="p-4 text-center text-slate-400">
                                  Nhóm này chưa có tiêu chí thành phần
                                </td>
                              </tr>
                            ) : (
                              group.children.map((crit, cIdx) => (
                                <tr key={crit.id} className="hover:bg-slate-50/50">
                                  <td className="px-4 py-2.5 text-center text-slate-500 font-medium">
                                    {groupIdx + 1}.{cIdx + 1}
                                  </td>
                                  <td className="px-4 py-2.5 font-mono text-slate-700 font-medium">
                                    {crit.fieldCode}
                                  </td>
                                  <td className="px-4 py-2.5">
                                    <div className="font-medium text-slate-800 text-xs">
                                      {crit.title}
                                    </div>
                                    {crit.description && (
                                      <div className="text-[11px] text-slate-500 mt-0.5 whitespace-pre-line leading-relaxed">
                                        {crit.description}
                                      </div>
                                    )}
                                  </td>
                                  <td className="px-4 py-2.5 text-center">
                                    <span className="inline-block font-mono font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                                      {crit.maxScore}đ
                                    </span>
                                  </td>
                                  <td className="px-4 py-2.5 text-center">
                                    {crit.isRequired ? (
                                      <span className="text-emerald-600 font-medium text-[11px]">
                                        Có
                                      </span>
                                    ) : (
                                      <span className="text-slate-400 text-[11px]">
                                        Không
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </div>

      {/* MODAL 1: XEM TRƯỚC MẪU PHIẾU (INTERACTIVE PREVIEW) */}
      <Modal
        open={previewOpen}
        wide
        title={`Xem trước mẫu phiếu đánh giá: ${formVersion.formName} (${formVersion.versionNo || "v1.0"})`}
        onClose={() => setPreviewOpen(false)}
        footer={
          <Button variant="primary" onClick={() => setPreviewOpen(false)}>
            Đóng xem trước
          </Button>
        }
      >
        <div className="max-h-[75vh] overflow-y-auto pr-1">
          <Renderer
            layout={
              Array.isArray(parsedLayout)
                ? {
                    blocks: parsedLayout,
                    formName: formVersion.formName,
                    formCode: formVersion.formCode,
                    semesterName: formVersion.semesterName
                  }
                : parsedLayout || {
                    blocks: [],
                    formName: formVersion.formName,
                    formCode: formVersion.formCode,
                    semesterName: formVersion.semesterName
                  }
            }
            isInteractive={true}
          />
        </div>
      </Modal>

      {/* MODAL 2: XEM CẤU HÌNH JSON (RAW LAYOUT) */}
      <Modal
        open={jsonModalOpen}
        wide
        title="Cấu hình JSON phiên bản biểu mẫu (templateLayoutJson)"
        onClose={() => setJsonModalOpen(false)}
        footer={
          <>
            <Button onClick={() => setJsonModalOpen(false)}>Đóng</Button>
            <Button
              variant="primary"
              onClick={handleCopyJson}
            >
              {copiedJson ? (
                <>
                  <Check className="size-4 mr-1 text-emerald-400" />
                  Đã sao chép
                </>
              ) : (
                <>
                  <Copy className="size-4 mr-1" />
                  Sao chép JSON
                </>
              )}
            </Button>
          </>
        }
      >
        <div className="relative">
          <pre className="max-h-[60vh] overflow-auto rounded-lg bg-slate-900 p-4 font-mono text-xs text-emerald-400 leading-relaxed">
            {formattedJsonString}
          </pre>
        </div>
      </Modal>
    </>
  )
}
