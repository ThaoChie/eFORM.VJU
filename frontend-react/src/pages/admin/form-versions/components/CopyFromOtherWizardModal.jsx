import React, { useState, useMemo, useEffect } from "react"
import {
  Search,
  CheckCircle,
  AlertTriangle,
  FolderKanban,
  ListTree,
  FileText,
  ChevronDown,
  ChevronRight,
  Layers,
  ArrowRight,
  ArrowLeft,
  X,
  Check,
  RotateCcw
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

  // Step 3 states
  // decisions: { [fieldCode]: "keep" | "overwrite" }
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
    // Initial decision: default to "overwrite" for conflicts
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
    const { fields: sourceFlatFields, signatureSlots, rawLayout, scope } =
      extractTreeFromTemplate(chosenVersion, allFieldCodes)

    // Build the final fields list:
    // 1. Keep existing current fields, except those marked as "overwrite"
    // 2. Add or overwrite fields from source that were selected
    const overwrittenCodes = new Set(
      Object.keys(decisions).filter((code) => decisions[code] === "overwrite")
    )
    const keptCodes = new Set(
      Object.keys(decisions).filter((code) => decisions[code] === "keep")
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
        // Add source field
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
        <tr className="hover:bg-slate-50 transition border-b border-slate-100">
          <td className="px-3 py-2 w-10 text-center">
            <input
              type="checkbox"
              checked={isChecked}
              onChange={() => handleToggleNode(node)}
              className="size-4 rounded text-brand focus:ring-brand cursor-pointer"
            />
          </td>
          <td className="px-3 py-2">
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
                <span className="w-6" />
              )}

              {isClassNode ? (
                node.classType === "ARRAY" || node.dataType === "ARRAY" ? (
                  <ListTree className="size-4 text-indigo-600 shrink-0" />
                ) : (
                  <FolderKanban className="size-4 text-purple-600 shrink-0" />
                )
              ) : (
                <FileText className="size-4 text-slate-400 shrink-0" />
              )}

              <span className="font-mono text-xs font-semibold text-brand">
                {node.fieldCode}
              </span>
            </div>
          </td>
          <td className="px-3 py-2 font-medium text-slate-800 text-xs">
            {node.fieldName}
          </td>
          <td className="px-3 py-2 text-xs">
            {isClassNode ? (
              node.classType === "ARRAY" || node.dataType === "ARRAY" ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Lớp lặp (ARRAY)
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                  Lớp (OBJECT)
                </span>
              )
            ) : (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
                {node.dataType || "STRING"}
              </span>
            )}
          </td>
          <td className="px-3 py-2 text-center text-xs">
            {node.isRequired ? (
              <span className="text-brand font-semibold">Bắt buộc</span>
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
        className="max-w-4xl"
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
        {/* Wizard Stepper Header */}
        <div className="mb-5 border-b border-line pb-4">
          <div className="flex items-center justify-between max-w-xl mx-auto">
            <div className="flex items-center gap-2">
              <span
                className={`flex size-7 items-center justify-center rounded-full text-xs font-bold ${
                  step === 1
                    ? "bg-brand text-white shadow"
                    : step > 1
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                1
              </span>
              <span
                className={`text-xs font-semibold ${
                  step === 1 ? "text-brand" : "text-slate-700"
                }`}
              >
                1. Chọn biểu mẫu nguồn
              </span>
            </div>
            <div className="h-0.5 w-12 bg-slate-200" />
            <div className="flex items-center gap-2">
              <span
                className={`flex size-7 items-center justify-center rounded-full text-xs font-bold ${
                  step === 2
                    ? "bg-brand text-white shadow"
                    : step > 2
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                2
              </span>
              <span
                className={`text-xs font-semibold ${
                  step === 2 ? "text-brand" : "text-slate-700"
                }`}
              >
                2. Chọn trường cần sao chép
              </span>
            </div>
            <div className="h-0.5 w-12 bg-slate-200" />
            <div className="flex items-center gap-2">
              <span
                className={`flex size-7 items-center justify-center rounded-full text-xs font-bold ${
                  step === 3
                    ? "bg-brand text-white shadow"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                3
              </span>
              <span
                className={`text-xs font-semibold ${
                  step === 3 ? "text-brand" : "text-slate-700"
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
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm theo mã biểu mẫu hoặc tên biểu mẫu..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-line pl-9 pr-4 py-2 text-xs focus:border-brand focus:outline-none"
                />
              </div>
              <Button
                variant="secondary"
                className="text-xs h-9 px-3 shrink-0"
                onClick={() => {}}
              >
                <Search className="size-3.5 mr-1" />
                Tìm kiếm
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Table 1: Danh sách Biểu mẫu */}
              <div className="border border-line rounded-lg overflow-hidden flex flex-col">
                <div className="bg-slate-50 px-3 py-2 border-b border-line font-semibold text-xs text-slate-700 uppercase tracking-wider">
                  Danh sách Biểu mẫu
                </div>
                <div className="max-h-64 overflow-y-auto divide-y divide-line">
                  {formList.length === 0 ? (
                    <div className="p-4 text-center text-xs text-muted">
                      Không tìm thấy biểu mẫu nào
                    </div>
                  ) : (
                    formList.map((form) => (
                      <label
                        key={form.formCode}
                        className={`flex items-start gap-3 p-3 cursor-pointer hover:bg-slate-50 transition ${
                          selectedFormCode === form.formCode
                            ? "bg-brand-soft/40 border-l-4 border-brand"
                            : ""
                        }`}
                      >
                        <input
                          type="radio"
                          name="selected_form_code"
                          checked={selectedFormCode === form.formCode}
                          onChange={() => setSelectedFormCode(form.formCode)}
                          className="mt-0.5 text-brand focus:ring-brand"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="font-mono text-xs font-bold text-brand">
                            {form.formCode}
                          </div>
                          <div className="text-xs text-slate-700 truncate font-medium mt-0.5">
                            {form.formName}
                          </div>
                          <div className="text-[11px] text-muted mt-0.5">
                            {form.versions.length} phiên bản
                          </div>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </div>

              {/* Table 2: Danh sách Phiên bản đã duyệt */}
              <div className="border border-line rounded-lg overflow-hidden flex flex-col">
                <div className="bg-slate-50 px-3 py-2 border-b border-line font-semibold text-xs text-slate-700 uppercase tracking-wider">
                  Danh sách Phiên bản đã duyệt
                </div>
                <div className="max-h-64 overflow-y-auto divide-y divide-line">
                  {!selectedFormCode ? (
                    <div className="p-4 text-center text-xs text-muted">
                      Vui lòng chọn 1 biểu mẫu ở bảng bên trái
                    </div>
                  ) : currentFormVersions.length === 0 ? (
                    <div className="p-4 text-center text-xs text-muted">
                      Biểu mẫu này chưa có phiên bản nào
                    </div>
                  ) : (
                    currentFormVersions.map((tpl) => (
                      <label
                        key={tpl.id}
                        className={`flex items-start gap-3 p-3 cursor-pointer hover:bg-slate-50 transition ${
                          selectedVersionId === tpl.id
                            ? "bg-brand-soft/40 border-l-4 border-brand"
                            : ""
                        }`}
                      >
                        <input
                          type="radio"
                          name="selected_version_id"
                          checked={selectedVersionId === tpl.id}
                          onChange={() => setSelectedVersionId(tpl.id)}
                          className="mt-0.5 text-brand focus:ring-brand"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-slate-800">
                              Mã PB: {tpl.id}
                            </span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-brand-soft text-brand border border-brand/20">
                              {tpl.versionNo}
                            </span>
                          </div>
                          <div className="text-xs text-slate-700 truncate font-medium mt-0.5">
                            {tpl.formName}
                          </div>
                          <div className="text-[11px] text-muted mt-0.5">
                            Trạng thái:{" "}
                            {tpl.isActive ? (
                              <span className="text-emerald-600 font-semibold">Đã duyệt / Hiệu lực</span>
                            ) : (
                              <span className="text-slate-500">{tpl.status || "Chưa kích hoạt"}</span>
                            )}
                          </div>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: CHỌN TRƯỜNG CẦN SAO CHÉP */}
        {step === 2 && (
          <div className="space-y-3">
            {/* Action Bar & Stats */}
            <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 p-3 rounded-lg border border-line">
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  className="text-xs h-8 px-2.5"
                  onClick={handleSelectAllStep2}
                >
                  <Check className="size-3.5 mr-1 text-emerald-600" />
                  Chọn tất cả
                </Button>
                <Button
                  variant="secondary"
                  className="text-xs h-8 px-2.5"
                  onClick={handleDeselectAllStep2}
                >
                  <RotateCcw className="size-3.5 mr-1 text-slate-400" />
                  Bỏ chọn
                </Button>
              </div>

              {/* Label Thống kê số lượng đã chọn */}
              <div className="text-xs font-medium text-slate-700">
                <span className="text-muted">Đã chọn: </span>
                <span className="font-semibold text-brand">
                  {step2Stats.atomicCount}
                </span>{" "}
                trường đơn lẻ,{" "}
                <span className="font-semibold text-purple-700">
                  {step2Stats.classCount}
                </span>{" "}
                lớp dữ liệu
              </div>
            </div>

            {/* Tree Table */}
            <div className="border border-line rounded-lg overflow-hidden max-h-[360px] overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-semibold uppercase tracking-wider sticky top-0 z-10">
                  <tr>
                    <th className="px-3 py-2 w-10 text-center">Chọn</th>
                    <th className="px-3 py-2">Mã trường / Lớp</th>
                    <th className="px-3 py-2">Tên hiển thị</th>
                    <th className="px-3 py-2">Phân loại</th>
                    <th className="px-3 py-2 text-center">Bắt buộc</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {sourceTree.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-muted">
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
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-6 text-center">
                <CheckCircle className="size-10 text-emerald-600 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-emerald-800">
                  Không có trường nào bị trùng lặp!
                </h3>
                <p className="text-xs text-emerald-700 mt-1 max-w-md mx-auto">
                  Tất cả {selectedNodeCodes.size} trường / lớp đã chọn từ nguồn sẽ được thêm mới hoàn toàn vào biểu mẫu hiện tại mà không làm thay đổi cấu hình hiện có.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs text-amber-700 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200">
                    Phát hiện <span className="font-bold">{conflicts.length}</span> trường bị trùng mã (ID) giữa biểu mẫu hiện tại và nguồn. Vui lòng chọn phương án xử lý:
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      className="text-xs h-7 px-2"
                      onClick={() => handleSetAllDecisions("keep")}
                    >
                      Tất cả giữ hiện tại
                    </Button>
                    <Button
                      variant="secondary"
                      className="text-xs h-7 px-2 text-brand font-semibold"
                      onClick={() => handleSetAllDecisions("overwrite")}
                    >
                      Tất cả đè bằng nguồn
                    </Button>
                  </div>
                </div>

                <div className="border border-line rounded-lg overflow-hidden max-h-[340px] overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-semibold uppercase tracking-wider sticky top-0 z-10">
                      <tr>
                        <th className="px-3 py-2">Trường</th>
                        <th className="px-3 py-2">Hiện tại</th>
                        <th className="px-3 py-2">Nguồn</th>
                        <th className="px-3 py-2 text-center w-28">
                          Giữ hiện tại
                        </th>
                        <th className="px-3 py-2 text-center w-28">
                          Đè bằng nguồn
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {conflicts.map((item) => {
                        const isKeep = decisions[item.fieldCode] === "keep"
                        const isOverwrite = decisions[item.fieldCode] === "overwrite"
                        return (
                          <tr
                            key={item.fieldCode}
                            className={`hover:bg-slate-50 transition ${
                              isOverwrite ? "bg-amber-50/40" : ""
                            }`}
                          >
                            <td className="px-3 py-2.5">
                              <div className="font-mono text-xs font-bold text-brand">
                                {item.fieldCode}
                              </div>
                              <div className="text-[11px] text-slate-600 truncate max-w-[150px]">
                                {item.fieldName}
                              </div>
                            </td>
                            <td className="px-3 py-2.5 text-[11px] text-slate-700">
                              <div>
                                Kiểu:{" "}
                                <span className="font-semibold">
                                  {item.currentNode.dataType}
                                </span>
                              </div>
                              <div className="text-muted">
                                {item.currentNode.isRequired
                                  ? "Bắt buộc"
                                  : "Tùy chọn"}
                              </div>
                            </td>
                            <td className="px-3 py-2.5 text-[11px] text-brand">
                              <div>
                                Kiểu:{" "}
                                <span className="font-semibold">
                                  {item.sourceNode.dataType}
                                </span>
                              </div>
                              <div className="text-muted">
                                {item.sourceNode.isRequired
                                  ? "Bắt buộc"
                                  : "Tùy chọn"}
                              </div>
                            </td>
                            <td className="px-3 py-2.5 text-center">
                              <label className="cursor-pointer inline-flex items-center">
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
                                  className="text-slate-600 focus:ring-slate-400"
                                />
                              </label>
                            </td>
                            <td className="px-3 py-2.5 text-center">
                              <label className="cursor-pointer inline-flex items-center">
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
                                  className="text-brand focus:ring-brand"
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
        <div className="space-y-2">
          <p className="text-sm text-slate-700">
            Hệ thống sẽ hủy bỏ toàn bộ các lựa chọn vừa thực hiện và quay về màn hình thiết kế ban đầu mà không lưu lại thay đổi.
          </p>
          <p className="text-xs text-muted">
            Bạn có chắc chắn muốn hủy thao tác sao chép không?
          </p>
        </div>
      </Modal>
    </>
  )
}
