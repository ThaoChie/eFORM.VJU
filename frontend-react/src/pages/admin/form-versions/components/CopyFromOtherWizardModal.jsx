import React, { useState, useMemo, useEffect } from "react"
import {
  Search,
  CheckCircle,
  FolderKanban,
  ListTree,
  FileText,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  ArrowLeft,
  Check,
  RotateCcw,
  Layers,
  AlertCircle
} from "lucide-react"
import { Button, Modal } from "../../../../components/ui/Primitives"
import { extractTreeFromTemplate, countTreeStats, flattenTree } from "../formVersionUtils"

export default function CopyFromOtherWizardModal({
  open,
  onClose,
  availableTemplates = [],
  allFieldCodes = [],
  currentFields = [],
  onApplyCopy
}) {
  // Wizard step: 1 (Chọn biểu mẫu nguồn), 2 (Chọn trường cần sao chép), 3 (Xử lý trùng lặp)
  const [step, setStep] = useState(1)

  // Step 1 states
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedFormCode, setSelectedFormCode] = useState(null)
  const [selectedVersionId, setSelectedVersionId] = useState(null)

  // Step 2 states
  const [sourceTree, setSourceTree] = useState([])
  const [selectedNodeCodes, setSelectedNodeCodes] = useState(new Set())
  const [expandedNodes, setExpandedNodes] = useState(new Set())

  // Step 3 states: decisions: { [fieldCode]: "keep" | "overwrite" }
  const [decisions, setDecisions] = useState({})

  // Cancel Confirmation Popup
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false)

  // Reset state when modal is opened
  useEffect(() => {
    if (open) {
      setStep(1)
      setSearchQuery("")
      setSelectedFormCode(null)
      setSelectedVersionId(null)
      setSourceTree([])
      setSelectedNodeCodes(new Set())
      setExpandedNodes(new Set())
      setDecisions({})
      setCancelConfirmOpen(false)
    }
  }, [open])

  // Group templates by formCode to build "Danh sách Biểu mẫu"
  const formList = useMemo(() => {
    const map = new Map()
    availableTemplates.forEach((tpl) => {
      const code = tpl.formCode || "UNKNOWN"
      if (!map.has(code)) {
        map.set(code, {
          formCode: code,
          formName: tpl.formName || code,
          versions: []
        })
      }
      map.get(code).versions.push(tpl)
    })
    const list = Array.from(map.values())
    if (!searchQuery.trim()) return list
    const q = searchQuery.toLowerCase().trim()
    return list.filter(
      (f) =>
        f.formCode.toLowerCase().includes(q) ||
        f.formName.toLowerCase().includes(q)
    )
  }, [availableTemplates, searchQuery])

  // Get versions for currently selected form
  const currentFormVersions = useMemo(() => {
    if (!selectedFormCode) return []
    const form = formList.find((f) => f.formCode === selectedFormCode)
    if (!form) return []
    return form.versions || []
  }, [formList, selectedFormCode])

  // When selectedFormCode changes, auto-select first version if available
  useEffect(() => {
    if (selectedFormCode && currentFormVersions.length > 0) {
      const activeOrFirst =
        currentFormVersions.find((v) => v.isActive) || currentFormVersions[0]
      setSelectedVersionId(activeOrFirst.id)
    } else {
      setSelectedVersionId(null)
    }
  }, [selectedFormCode, currentFormVersions])

  // Handle step 1 "Tiếp tục"
  const handleProceedToStep2 = () => {
    const chosenVersion = availableTemplates.find(
      (t) => t.id === selectedVersionId
    )
    if (!chosenVersion) return

    const { tree } = extractTreeFromTemplate(chosenVersion, allFieldCodes)
    setSourceTree(tree)

    // Expand all nodes by default
    const allIds = new Set()
    const allCodes = new Set()
    const collect = (nodes) => {
      nodes.forEach((n) => {
        allIds.add(n.id || n.fieldCode)
        allCodes.add(n.fieldCode)
        if (n.children && n.children.length > 0) {
          collect(n.children)
        }
      })
    }
    collect(tree)
    setExpandedNodes(allIds)
    setSelectedNodeCodes(allCodes) // Default select all

    setStep(2)
  }

  // Flattened source tree
  const flattenedSource = useMemo(() => {
    return flattenTree(sourceTree)
  }, [sourceTree])

  // Step 2 selection count stats
  const step2Stats = useMemo(() => {
    const selectedNodes = flattenedSource.filter((n) =>
      selectedNodeCodes.has(n.fieldCode)
    )
    return countTreeStats(selectedNodes)
  }, [flattenedSource, selectedNodeCodes])

  // Select all / Deselect all
  const handleSelectAllStep2 = () => {
    const allCodes = new Set(flattenedSource.map((n) => n.fieldCode))
    setSelectedNodeCodes(allCodes)
  }

  const handleDeselectAllStep2 = () => {
    setSelectedNodeCodes(new Set())
  }

  // Toggle single node and its descendants
  const handleToggleNode = (node) => {
    const next = new Set(selectedNodeCodes)
    const isChecked = next.has(node.fieldCode)

    const toggleSubtree = (n, checkState) => {
      if (checkState) {
        next.add(n.fieldCode)
      } else {
        next.delete(n.fieldCode)
      }
      if (n.children && n.children.length > 0) {
        n.children.forEach((c) => toggleSubtree(c, checkState))
      }
    }

    toggleSubtree(node, !isChecked)
    setSelectedNodeCodes(next)
  }

  // Toggle tree expand/collapse
  const handleToggleExpand = (id) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Step 3: detect conflicts
  const conflicts = useMemo(() => {
    if (step !== 3) return []
    const currentCodeMap = new Map()
    const flatCurrent = flattenTree(currentFields)
    flatCurrent.forEach((f) => {
      if (f.fieldCode) currentCodeMap.set(f.fieldCode, f)
    })

    const selectedSourceNodes = flattenedSource.filter((n) =>
      selectedNodeCodes.has(n.fieldCode)
    )

    const list = []
    selectedSourceNodes.forEach((src) => {
      const cur = currentCodeMap.get(src.fieldCode)
      if (cur) {
        list.push({
          fieldCode: src.fieldCode,
          fieldName: src.fieldName || cur.fieldName,
          currentNode: cur,
          sourceNode: src
        })
      }
    })
    return list
  }, [step, flattenedSource, selectedNodeCodes, currentFields])

  // Handle Proceed to Step 3
  const handleProceedToStep3 = () => {
    const initial = {}
    const currentCodeMap = new Map()
    const flatCurrent = flattenTree(currentFields)
    flatCurrent.forEach((f) => {
      if (f.fieldCode) currentCodeMap.set(f.fieldCode, f)
    })

    flattenedSource.forEach((src) => {
      if (selectedNodeCodes.has(src.fieldCode) && currentCodeMap.has(src.fieldCode)) {
        initial[src.fieldCode] = "overwrite"
      }
    })
    setDecisions(initial)
    setStep(3)
  }

  // Quick actions in Step 3
  const handleSetAllDecisions = (decisionType) => {
    const updated = {}
    conflicts.forEach((c) => {
      updated[c.fieldCode] = decisionType
    })
    setDecisions(updated)
  }

  // Complete and apply
  const handleComplete = () => {
    const chosenVersion = availableTemplates.find(
      (t) => t.id === selectedVersionId
    )
    const { signatureSlots, rawLayout, scope } =
      extractTreeFromTemplate(chosenVersion, allFieldCodes)

    const overwrittenCodes = new Set(
      Object.keys(decisions).filter((code) => decisions[code] === "overwrite")
    )

    const flatCurrent = flattenTree(currentFields)
    const currentCodeMap = new Map(flatCurrent.map((f) => [f.fieldCode, f]))

    const selectedSourceNodes = flattenedSource.filter((n) =>
      selectedNodeCodes.has(n.fieldCode)
    )

    // Base current fields that are not overwritten
    const finalFields = []
    flatCurrent.forEach((f) => {
      if (!overwrittenCodes.has(f.fieldCode)) {
        finalFields.push(f)
      }
    })

    // Add source fields that were chosen and are either new or marked as overwrite
    selectedSourceNodes.forEach((src) => {
      const isExisting = currentCodeMap.has(src.fieldCode)
      if (!isExisting || overwrittenCodes.has(src.fieldCode)) {
        finalFields.push(src)
      }
    })

    onApplyCopy({
      fields: finalFields,
      sourceVersion: chosenVersion,
      signatureSlots,
      rawLayout,
      scope
    })

    onClose()
  }

  // Handle Cancel button click
  const handleCancelClick = () => {
    setCancelConfirmOpen(true)
  }

  // Confirm cancel
  const handleConfirmCancel = () => {
    setCancelConfirmOpen(false)
    onClose()
  }

  if (!open) return null

  // Recursive tree row renderer for Step 2
  const renderTreeNode = (node, depth = 0) => {
    const isExpanded = expandedNodes.has(node.id || node.fieldCode)
    const hasChildren = node.children && node.children.length > 0
    const isChecked = selectedNodeCodes.has(node.fieldCode)
    const isClassNode =
      node.isClass || node.dataType === "OBJECT" || node.dataType === "ARRAY"

    return (
      <React.Fragment key={node.id || node.fieldCode}>
        <tr className="hover:bg-slate-50/80 transition-colors border-b border-slate-100">
          <td className="px-4 py-3 w-12 text-center">
            <input
              type="checkbox"
              checked={isChecked}
              onChange={() => handleToggleNode(node)}
              className="size-4 rounded border-slate-300 text-brand focus:ring-brand cursor-pointer"
            />
          </td>
          <td className="px-4 py-3 min-w-[260px]">
            <div
              className="flex items-center gap-2"
              style={{ paddingLeft: `${depth * 20}px` }}
            >
              {hasChildren ? (
                <button
                  type="button"
                  onClick={() => handleToggleExpand(node.id || node.fieldCode)}
                  className="p-1 text-slate-400 hover:text-slate-700 transition rounded"
                >
                  {isExpanded ? (
                    <ChevronDown className="size-4" />
                  ) : (
                    <ChevronRight className="size-4" />
                  )}
                </button>
              ) : (
                <span className="w-6 inline-block" />
              )}

              {isClassNode ? (
                node.classType === "ARRAY" || node.dataType === "ARRAY" ? (
                  <ListTree className="size-4 text-slate-500 shrink-0" />
                ) : (
                  <FolderKanban className="size-4 text-slate-500 shrink-0" />
                )
              ) : (
                <FileText className="size-4 text-slate-400 shrink-0" />
              )}

              <span className="font-mono text-xs font-semibold text-slate-800">
                {node.fieldCode}
              </span>
            </div>
          </td>
          <td className="px-4 py-3 text-slate-800 text-xs">
            {node.fieldName}
          </td>
          <td className="px-4 py-3 text-xs w-40 whitespace-nowrap">
            {isClassNode ? (
              node.classType === "ARRAY" || node.dataType === "ARRAY" ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                  Lớp lặp (ARRAY)
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                  Lớp (OBJECT)
                </span>
              )
            ) : (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600">
                {node.dataType || "STRING"}
              </span>
            )}
          </td>
          <td className="px-4 py-3 text-center text-xs w-28 whitespace-nowrap">
            {node.isRequired ? (
              <span className="font-semibold text-slate-700">Bắt buộc</span>
            ) : (
              <span className="text-slate-400">Tùy chọn</span>
            )}
          </td>
        </tr>
        {hasChildren &&
          isExpanded &&
          node.children.map((child) => renderTreeNode(child, depth + 1))}
      </React.Fragment>
    )
  }

  return (
    <>
      <Modal
        open={open}
        title="Sao chép từ biểu mẫu khác"
        onClose={handleCancelClick}
        size="3xl"
        className="max-w-5xl xl:max-w-6xl"
        footer={
          <div className="flex w-full items-center justify-between">
            <Button variant="secondary" onClick={handleCancelClick}>
              Hủy
            </Button>
            <div className="flex items-center gap-2">
              {step > 1 && (
                <Button
                  variant="secondary"
                  onClick={() => setStep((s) => s - 1)}
                >
                  <ArrowLeft className="size-4 mr-1" />
                  Quay lại
                </Button>
              )}
              {step === 1 && (
                <Button
                  variant="primary"
                  disabled={!selectedFormCode || !selectedVersionId}
                  onClick={handleProceedToStep2}
                >
                  Tiếp tục
                  <ArrowRight className="size-4 ml-1" />
                </Button>
              )}
              {step === 2 && (
                <Button
                  variant="primary"
                  disabled={selectedNodeCodes.size === 0}
                  onClick={handleProceedToStep3}
                >
                  Tiếp tục
                  <ArrowRight className="size-4 ml-1" />
                </Button>
              )}
              {step === 3 && (
                <Button variant="primary" onClick={handleComplete}>
                  <Check className="size-4 mr-1" />
                  Hoàn tất
                </Button>
              )}
            </div>
          </div>
        }
      >
        {/* Clean, Elegant Stepper Header */}
        <div className="mb-6 border-b border-slate-200 pb-5">
          <div className="flex items-center justify-center max-w-2xl mx-auto gap-3">
            {/* Step 1 Indicator */}
            <div className="flex items-center gap-2.5">
              <span
                className={`flex size-7 items-center justify-center rounded-full text-xs font-bold transition ${
                  step === 1
                    ? "bg-brand text-white shadow-sm"
                    : step > 1
                    ? "bg-slate-700 text-white"
                    : "bg-slate-100 text-slate-500 border border-slate-300"
                }`}
              >
                {step > 1 ? <Check className="size-3.5" /> : 1}
              </span>
              <span
                className={`text-xs ${
                  step === 1 ? "font-bold text-brand" : "font-medium text-slate-700"
                }`}
              >
                1. Chọn biểu mẫu nguồn
              </span>
            </div>

            <div className="h-px w-16 bg-slate-300" />

            {/* Step 2 Indicator */}
            <div className="flex items-center gap-2.5">
              <span
                className={`flex size-7 items-center justify-center rounded-full text-xs font-bold transition ${
                  step === 2
                    ? "bg-brand text-white shadow-sm"
                    : step > 2
                    ? "bg-slate-700 text-white"
                    : "bg-slate-100 text-slate-500 border border-slate-300"
                }`}
              >
                {step > 2 ? <Check className="size-3.5" /> : 2}
              </span>
              <span
                className={`text-xs ${
                  step === 2 ? "font-bold text-brand" : "font-medium text-slate-700"
                }`}
              >
                2. Chọn trường cần sao chép
              </span>
            </div>

            <div className="h-px w-16 bg-slate-300" />

            {/* Step 3 Indicator */}
            <div className="flex items-center gap-2.5">
              <span
                className={`flex size-7 items-center justify-center rounded-full text-xs font-bold transition ${
                  step === 3
                    ? "bg-brand text-white shadow-sm"
                    : "bg-slate-100 text-slate-500 border border-slate-300"
                }`}
              >
                3
              </span>
              <span
                className={`text-xs ${
                  step === 3 ? "font-bold text-brand" : "font-medium text-slate-700"
                }`}
              >
                3. Xử lý trùng lặp
              </span>
            </div>
          </div>
        </div>

        {/* STEP 1: CHỌN BIỂU MẪU NGUỒN */}
        {step === 1 && (
          <div className="space-y-4">
            {/* Search Box */}
            <div className="relative max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm kiếm theo mã biểu mẫu hoặc tên biểu mẫu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white pl-10 pr-4 py-2 text-xs focus:border-brand focus:ring-1 focus:ring-brand focus:outline-none"
              />
            </div>

            {/* Two Side-by-Side Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Table 1: Danh sách Biểu mẫu */}
              <div className="border border-slate-200 rounded-lg overflow-hidden flex flex-col bg-white shadow-2xs">
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 font-semibold text-xs text-slate-700 uppercase tracking-wider flex items-center justify-between">
                  <span>Danh sách Biểu mẫu</span>
                  <span className="text-[11px] font-normal text-slate-500 lowercase">
                    ({formList.length} biểu mẫu)
                  </span>
                </div>
                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {formList.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400">
                      Không tìm thấy biểu mẫu nào phù hợp
                    </div>
                  ) : (
                    formList.map((form) => {
                      const isSelected = selectedFormCode === form.formCode
                      return (
                        <label
                          key={form.formCode}
                          className={`flex items-start gap-3 p-3.5 cursor-pointer hover:bg-slate-50 transition-colors ${
                            isSelected ? "bg-slate-50 border-l-4 border-brand" : ""
                          }`}
                        >
                          <input
                            type="radio"
                            name="selected_form_code"
                            checked={isSelected}
                            onChange={() => setSelectedFormCode(form.formCode)}
                            className="mt-0.5 text-brand focus:ring-brand cursor-pointer"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-mono text-xs font-bold text-slate-800">
                                {form.formCode}
                              </span>
                              <span className="text-[11px] text-slate-500">
                                {form.versions.length} phiên bản
                              </span>
                            </div>
                            <div className="text-xs text-slate-600 mt-1 line-clamp-2">
                              {form.formName}
                            </div>
                          </div>
                        </label>
                      )
                    })
                  )}
                </div>
              </div>

              {/* Table 2: Danh sách Phiên bản đã duyệt */}
              <div className="border border-slate-200 rounded-lg overflow-hidden flex flex-col bg-white shadow-2xs">
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 font-semibold text-xs text-slate-700 uppercase tracking-wider flex items-center justify-between">
                  <span>Danh sách Phiên bản đã duyệt</span>
                  {selectedFormCode && (
                    <span className="text-[11px] font-normal text-slate-500">
                      ({currentFormVersions.length} phiên bản)
                    </span>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {!selectedFormCode ? (
                    <div className="p-8 text-center text-xs text-slate-400">
                      Vui lòng chọn 1 biểu mẫu ở cột bên trái
                    </div>
                  ) : currentFormVersions.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400">
                      Biểu mẫu này chưa có phiên bản nào
                    </div>
                  ) : (
                    currentFormVersions.map((tpl) => {
                      const isSelected = selectedVersionId === tpl.id
                      return (
                        <label
                          key={tpl.id}
                          className={`flex items-start gap-3 p-3.5 cursor-pointer hover:bg-slate-50 transition-colors ${
                            isSelected ? "bg-slate-50 border-l-4 border-brand" : ""
                          }`}
                        >
                          <input
                            type="radio"
                            name="selected_version_id"
                            checked={isSelected}
                            onChange={() => setSelectedVersionId(tpl.id)}
                            className="mt-0.5 text-brand focus:ring-brand cursor-pointer"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-semibold text-slate-800">
                                Mã PB: {tpl.id}
                              </span>
                              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                                {tpl.versionNo}
                              </span>
                            </div>
                            <div className="text-xs text-slate-600 mt-1 line-clamp-2">
                              {tpl.formName}
                            </div>
                            <div className="text-[11px] text-slate-500 mt-1">
                              Trạng thái:{" "}
                              {tpl.isActive ? (
                                <span className="text-emerald-700 font-medium">Đã duyệt / Hiệu lực</span>
                              ) : (
                                <span className="text-slate-500">{tpl.status || "Chưa kích hoạt"}</span>
                              )}
                            </div>
                          </div>
                        </label>
                      )
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: CHỌN TRƯỜNG CẦN SAO CHÉP */}
        {step === 2 && (
          <div className="space-y-4">
            {/* Action Bar & Stats */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 px-4 py-3 rounded-lg border border-slate-200">
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  className="text-xs h-8 px-3"
                  onClick={handleSelectAllStep2}
                >
                  <Check className="size-3.5 mr-1.5 text-slate-600" />
                  Chọn tất cả
                </Button>
                <Button
                  variant="secondary"
                  className="text-xs h-8 px-3"
                  onClick={handleDeselectAllStep2}
                >
                  <RotateCcw className="size-3.5 mr-1.5 text-slate-400" />
                  Bỏ chọn
                </Button>
              </div>

              {/* Label Thống kê số lượng đã chọn */}
              <div className="text-xs font-medium text-slate-700">
                <span className="text-slate-500">Đã chọn: </span>
                <strong className="text-slate-900">{step2Stats.atomicCount}</strong> trường đơn lẻ,{" "}
                <strong className="text-slate-900">{step2Stats.classCount}</strong> lớp dữ liệu
              </div>
            </div>

            {/* Tree Table */}
            <div className="border border-slate-200 rounded-lg overflow-hidden max-h-[420px] overflow-y-auto bg-white">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-semibold uppercase tracking-wider sticky top-0 z-10 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 w-12 text-center">Chọn</th>
                    <th className="px-4 py-3 min-w-[260px]">Mã trường / Lớp</th>
                    <th className="px-4 py-3">Tên hiển thị</th>
                    <th className="px-4 py-3 w-40">Phân loại</th>
                    <th className="px-4 py-3 text-center w-28">Bắt buộc</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sourceTree.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400">
                        Biểu mẫu nguồn không có trường dữ liệu nào
                      </td>
                    </tr>
                  ) : (
                    sourceTree.map((node) => renderTreeNode(node, 0))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* STEP 3: XỬ LÝ TRÙNG LẶP */}
        {step === 3 && (
          <div className="space-y-4">
            {conflicts.length === 0 ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-8 text-center">
                <CheckCircle className="size-10 text-emerald-600 mx-auto mb-2" />
                <h3 className="text-sm font-semibold text-slate-800">
                  Không có trường nào bị trùng lặp
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  Tất cả {selectedNodeCodes.size} trường / lớp đã chọn từ nguồn sẽ được thêm mới an toàn vào biểu mẫu hiện tại.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                  <div className="flex items-center gap-2 text-xs text-slate-700">
                    <AlertCircle className="size-4 text-amber-600 shrink-0" />
                    <span>
                      Phát hiện <strong>{conflicts.length}</strong> trường bị trùng mã giữa biểu mẫu hiện tại và nguồn:
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      className="text-xs h-7 px-2.5 text-slate-700"
                      onClick={() => handleSetAllDecisions("keep")}
                    >
                      Tất cả giữ hiện tại
                    </Button>
                    <Button
                      variant="secondary"
                      className="text-xs h-7 px-2.5 text-slate-900 font-semibold"
                      onClick={() => handleSetAllDecisions("overwrite")}
                    >
                      Tất cả đè bằng nguồn
                    </Button>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-lg overflow-hidden max-h-[380px] overflow-y-auto bg-white">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-700 font-semibold uppercase tracking-wider sticky top-0 z-10 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3 w-64">Trường</th>
                        <th className="px-4 py-3 min-w-[200px]">Cấu hình hiện tại</th>
                        <th className="px-4 py-3 min-w-[200px]">Cấu hình nguồn</th>
                        <th className="px-4 py-3 text-center w-36 whitespace-nowrap">
                          Giữ hiện tại
                        </th>
                        <th className="px-4 py-3 text-center w-36 whitespace-nowrap">
                          Đè bằng nguồn
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {conflicts.map((item) => {
                        const isKeep = decisions[item.fieldCode] === "keep"
                        const isOverwrite = decisions[item.fieldCode] === "overwrite"
                        return (
                          <tr
                            key={item.fieldCode}
                            className={`hover:bg-slate-50 transition-colors ${
                              isOverwrite ? "bg-slate-50/70" : ""
                            }`}
                          >
                            <td className="px-4 py-3">
                              <div className="font-mono text-xs font-semibold text-slate-800">
                                {item.fieldCode}
                              </div>
                              <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                                {item.fieldName}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-xs text-slate-700">
                              <div>
                                Kiểu:{" "}
                                <span className="font-medium text-slate-800">
                                  {item.currentNode.dataType}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-500 mt-0.5">
                                {item.currentNode.isRequired ? "Bắt buộc" : "Tùy chọn"}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-xs text-slate-700">
                              <div>
                                Kiểu:{" "}
                                <span className="font-medium text-slate-800">
                                  {item.sourceNode.dataType}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-500 mt-0.5">
                                {item.sourceNode.isRequired ? "Bắt buộc" : "Tùy chọn"}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <label className="cursor-pointer inline-flex items-center justify-center p-1">
                                <input
                                  type="radio"
                                  name={`decision_${item.fieldCode}`}
                                  checked={isKeep}
                                  onChange={() =>
                                    setDecisions((prev) => ({
                                      ...prev,
                                      [item.fieldCode]: "keep"
                                    }))
                                  }
                                  className="text-slate-700 focus:ring-slate-400 size-4 cursor-pointer"
                                />
                              </label>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <label className="cursor-pointer inline-flex items-center justify-center p-1">
                                <input
                                  type="radio"
                                  name={`decision_${item.fieldCode}`}
                                  checked={isOverwrite}
                                  onChange={() =>
                                    setDecisions((prev) => ({
                                      ...prev,
                                      [item.fieldCode]: "overwrite"
                                    }))
                                  }
                                  className="text-brand focus:ring-brand size-4 cursor-pointer"
                                />
                              </label>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* POPUP XÁC NHẬN HỦY THAO TÁC */}
      <Modal
        open={cancelConfirmOpen}
        title="Xác nhận hủy thao tác"
        onClose={() => setCancelConfirmOpen(false)}
        size="sm"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setCancelConfirmOpen(false)}
            >
              Tiếp tục
            </Button>
            <Button variant="danger" onClick={handleConfirmCancel}>
              Hủy thao tác
            </Button>
          </>
        }
      >
        <div className="space-y-2 text-xs text-slate-600">
          <p>
            Hệ thống sẽ hủy bỏ toàn bộ các lựa chọn vừa thực hiện và quay về màn hình ban đầu mà không lưu lại thay đổi.
          </p>
          <p className="font-medium text-slate-700">
            Bạn có chắc chắn muốn hủy thao tác sao chép không?
          </p>
        </div>
      </Modal>
    </>
  )
}
