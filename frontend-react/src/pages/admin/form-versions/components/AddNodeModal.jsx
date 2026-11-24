import React, { useState, useMemo, useEffect } from "react"
import {
  FileText,
  FolderKanban,
  ListTree,
  Search,
  Check,
  RotateCcw,
  Plus,
  Layers,
  ChevronRight
} from "lucide-react"
import { Button, Modal } from "../../../../components/ui/Primitives"

export default function AddNodeModal({
  open,
  onClose,
  allFieldCodes = [],
  existingNodes = [],
  targetParentCode = null,
  onAddNodes
}) {
  // 3 node types: "ATOMIC", "OBJECT", "ARRAY"
  const [nodeType, setNodeType] = useState("ATOMIC")

  // Target class parent
  const [parentClassCode, setParentClassCode] = useState(targetParentCode || "")

  // Sync targetParentCode when opened
  useEffect(() => {
    if (open) {
      setParentClassCode(targetParentCode || "")
      setSelectedMasterIds(new Set())
      setSearchTerm("")
      setApplyMasterValidation(true)

      // Reset custom class form
      setCustomClassCode("")
      setCustomClassName("")
      setCustomArrayItemType("OBJECT")
      setCustomMin(0)
      setCustomMax("")
    }
  }, [open, targetParentCode])

  // Extract all existing OBJECT / ARRAY classes to populate "Thêm vào lớp" combobox
  const availableParentClasses = useMemo(() => {
    const list = []
    const walk = (nodes) => {
      if (!Array.isArray(nodes)) return
      nodes.forEach((n) => {
        if (n.isClass || n.dataType === "OBJECT" || n.dataType === "ARRAY") {
          list.push(n)
        }
        if (n.children && n.children.length > 0) {
          walk(n.children)
        }
      })
    }
    walk(existingNodes)
    return list
  }, [existingNodes])

  // ATOMIC Fields selection states
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedMasterIds, setSelectedMasterIds] = useState(new Set())
  const [applyMasterValidation, setApplyMasterValidation] = useState(true)

  // Filter atomic fields from Field Master
  const atomicMasterFields = useMemo(() => {
    return allFieldCodes.filter(
      (f) => f.dataType !== "OBJECT" && f.dataType !== "ARRAY"
    )
  }, [allFieldCodes])

  const filteredAtomicFields = useMemo(() => {
    if (!searchTerm.trim()) return atomicMasterFields
    const q = searchTerm.toLowerCase().trim()
    return atomicMasterFields.filter(
      (f) =>
        f.fieldCode?.toLowerCase().includes(q) ||
        f.fieldName?.toLowerCase().includes(q) ||
        f.category?.toLowerCase().includes(q)
    )
  }, [atomicMasterFields, searchTerm])

  const handleToggleSelectMaster = (id) => {
    setSelectedMasterIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleSelectAllAtomic = () => {
    setSelectedMasterIds(new Set(filteredAtomicFields.map((f) => f.id || f.fieldCode)))
  }

  const handleDeselectAllAtomic = () => {
    setSelectedMasterIds(new Set())
  }

  // OBJECT / ARRAY Custom creation states
  const [customClassCode, setCustomClassCode] = useState("")
  const [customClassName, setCustomClassName] = useState("")
  const [customArrayItemType, setCustomArrayItemType] = useState("OBJECT")
  const [customMin, setCustomMin] = useState(0)
  const [customMax, setCustomMax] = useState("")

  // Master classes (OBJECT / ARRAY from master)
  const masterClassOptions = useMemo(() => {
    if (nodeType === "OBJECT") {
      return allFieldCodes.filter((f) => f.dataType === "OBJECT")
    }
    if (nodeType === "ARRAY") {
      return allFieldCodes.filter((f) => f.dataType === "ARRAY")
    }
    return []
  }, [allFieldCodes, nodeType])

  const [selectedMasterClassCode, setSelectedMasterClassCode] = useState("")

  const handleSelectMasterClass = (e) => {
    const code = e.target.value
    setSelectedMasterClassCode(code)
    if (code) {
      const found = allFieldCodes.find((f) => f.fieldCode === code)
      if (found) {
        setCustomClassCode(found.fieldCode)
        setCustomClassName(found.fieldName || found.fieldCode)
      }
    }
  }

  // Handle Submit / Add nodes
  const handleConfirmAdd = () => {
    if (nodeType === "ATOMIC") {
      const selected = allFieldCodes.filter((f) =>
        selectedMasterIds.has(f.id || f.fieldCode)
      )
      if (selected.length === 0) return

      const newNodes = selected.map((f) => ({
        id: `atomic_${f.fieldCode}_${Date.now()}`,
        fieldCode: f.fieldCode,
        fieldName: f.fieldName || f.fieldCode,
        dataType: f.dataType || "NUMBER",
        category: f.category || "COMMON",
        isRequired: !!f.isRequired,
        isClass: false,
        parentCode: parentClassCode || null,
        validationRules: applyMasterValidation && f.validationRules ? f.validationRules : []
      }))

      onAddNodes(newNodes, parentClassCode)
    } else if (nodeType === "OBJECT") {
      if (!customClassCode.trim()) return

      const newObjectNode = {
        id: `object_${customClassCode.trim()}_${Date.now()}`,
        fieldCode: customClassCode.trim(),
        fieldName: customClassName.trim() || customClassCode.trim(),
        dataType: "OBJECT",
        category: "CLASS",
        isRequired: false,
        isClass: true,
        classType: "OBJECT",
        parentCode: parentClassCode || null,
        effectiveFrom: "",
        effectiveTo: "",
        isActive: true,
        renderCondition: "",
        validationRules: [],
        changeReason: "",
        children: []
      }

      onAddNodes([newObjectNode], parentClassCode)
    } else if (nodeType === "ARRAY") {
      if (!customClassCode.trim()) return

      const newArrayNode = {
        id: `array_${customClassCode.trim()}_${Date.now()}`,
        fieldCode: customClassCode.trim(),
        fieldName: customClassName.trim() || customClassCode.trim(),
        dataType: "ARRAY",
        category: "CLASS",
        isRequired: false,
        isClass: true,
        classType: "ARRAY",
        parentCode: parentClassCode || null,
        itemType: customArrayItemType,
        min: Number(customMin) || 0,
        max: customMax === "" ? null : Number(customMax),
        effectiveFrom: "",
        effectiveTo: "",
        isActive: true,
        renderCondition: "",
        validationRules: [],
        changeReason: "",
        children: []
      }

      onAddNodes([newArrayNode], parentClassCode)
    }

    onClose()
  }

  if (!open) return null

  const targetLabel = parentClassCode
    ? `lớp "${parentClassCode}"`
    : "gốc biểu mẫu"

  return (
    <Modal
      open={open}
      title="Thêm node vào cây"
      onClose={onClose}
      className="max-w-3xl"
      footer={
        <div className="flex w-full items-center justify-between">
          <Button variant="secondary" onClick={onClose}>
            Hủy
          </Button>

          {nodeType === "ATOMIC" ? (
            <Button
              variant="primary"
              disabled={selectedMasterIds.size === 0}
              onClick={handleConfirmAdd}
            >
              <Plus className="size-4 mr-1" />
              Thêm {selectedMasterIds.size > 0 ? selectedMasterIds.size : ""} trường vào {targetLabel}
            </Button>
          ) : (
            <Button
              variant="primary"
              disabled={!customClassCode.trim()}
              onClick={handleConfirmAdd}
            >
              <Plus className="size-4 mr-1" />
              Thêm {nodeType === "ARRAY" ? "Lớp lặp (ARRAY)" : "Lớp (OBJECT)"} vào {targetLabel}
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-4">
        {/* LỰA CHỌN CẤU TRÚC LOẠI NODE (3 LOẠI THEO RSD) */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2">
            Chọn cấu trúc loại Node:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* 1. Field nguyên tử */}
            <label
              className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition ${
                nodeType === "ATOMIC"
                  ? "border-brand bg-brand-soft/40 shadow-xs ring-1 ring-brand"
                  : "border-line hover:bg-slate-50"
              }`}
            >
              <input
                type="radio"
                name="node_type"
                checked={nodeType === "ATOMIC"}
                onChange={() => setNodeType("ATOMIC")}
                className="mt-0.5 text-brand focus:ring-brand"
              />
              <div>
                <div className="font-semibold text-xs text-slate-800 flex items-center gap-1.5">
                  <FileText className="size-3.5 text-brand" />
                  Field nguyên tử
                </div>
                <p className="text-[11px] text-muted mt-1 leading-snug">
                  STRING, NUMBER, DATE, ... giá trị đơn lẻ thuần túy từ Field Master.
                </p>
              </div>
            </label>

            {/* 2. Lớp (OBJECT) */}
            <label
              className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition ${
                nodeType === "OBJECT"
                  ? "border-purple-600 bg-purple-50 shadow-xs ring-1 ring-purple-600"
                  : "border-line hover:bg-slate-50"
              }`}
            >
              <input
                type="radio"
                name="node_type"
                checked={nodeType === "OBJECT"}
                onChange={() => setNodeType("OBJECT")}
                className="mt-0.5 text-purple-600 focus:ring-purple-500"
              />
              <div>
                <div className="font-semibold text-xs text-slate-800 flex items-center gap-1.5">
                  <FolderKanban className="size-3.5 text-purple-600" />
                  Lớp (OBJECT)
                </div>
                <p className="text-[11px] text-muted mt-1 leading-snug">
                  Nhóm các trường dữ liệu lại thành tập hợp phức hợp lồng nhau.
                </p>
              </div>
            </label>

            {/* 3. Lớp lặp (ARRAY) */}
            <label
              className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition ${
                nodeType === "ARRAY"
                  ? "border-indigo-600 bg-indigo-50 shadow-xs ring-1 ring-indigo-600"
                  : "border-line hover:bg-slate-50"
              }`}
            >
              <input
                type="radio"
                name="node_type"
                checked={nodeType === "ARRAY"}
                onChange={() => setNodeType("ARRAY")}
                className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <div className="font-semibold text-xs text-slate-800 flex items-center gap-1.5">
                  <ListTree className="size-3.5 text-indigo-600" />
                  Lớp lặp (ARRAY)
                </div>
                <p className="text-[11px] text-muted mt-1 leading-snug">
                  Cấu trúc lặp danh sách / bảng dòng động có min/max.
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* VỊ TRÍ THÊM: GỐC HOẶC LỚP CHA */}
        <div className="bg-slate-50 p-3 rounded-lg border border-line flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Layers className="size-4 text-slate-500 shrink-0" />
            <span className="text-xs font-semibold text-slate-700">
              Vị trí thêm (Lớp cha):
            </span>
          </div>
          <select
            value={parentClassCode}
            onChange={(e) => setParentClassCode(e.target.value)}
            className="rounded-lg border border-line bg-white px-3 py-1.5 text-xs focus:border-brand focus:outline-none min-w-[240px]"
          >
            <option value="">Gốc biểu mẫu (Root)</option>
            {availableParentClasses.map((cls) => (
              <option key={cls.fieldCode} value={cls.fieldCode}>
                Lớp: {cls.fieldCode} ({cls.fieldName})
              </option>
            ))}
          </select>
        </div>

        {/* NỘI DUNG FORM THEO TỪNG LOẠI NODE */}

        {/* 1. FIELD NGUYÊN TỬ */}
        {nodeType === "ATOMIC" && (
          <div className="space-y-3">
            {/* Search & Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Nhập dữ liệu tìm kiếm trường field code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-lg border border-line pl-9 pr-3 py-1.5 text-xs focus:border-brand focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  className="text-xs h-8 px-2"
                  onClick={handleSelectAllAtomic}
                >
                  <Check className="size-3.5 mr-1 text-emerald-600" />
                  Chọn tất cả
                </Button>
                <Button
                  variant="secondary"
                  className="text-xs h-8 px-2"
                  onClick={handleDeselectAllAtomic}
                >
                  <RotateCcw className="size-3.5 mr-1 text-slate-400" />
                  Bỏ chọn
                </Button>
              </div>
            </div>

            {/* Validation Checkbox */}
            <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={applyMasterValidation}
                onChange={(e) => setApplyMasterValidation(e.target.checked)}
                className="size-4 rounded text-brand focus:ring-brand"
              />
              <span className="font-medium">
                Áp dụng validation mặc định từ Field Master
              </span>
            </label>

            {/* Atomic Master Fields Table */}
            <div className="border border-line rounded-lg overflow-hidden max-h-60 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-semibold uppercase tracking-wider sticky top-0 z-10">
                  <tr>
                    <th className="px-3 py-2 w-10 text-center">Tích chọn</th>
                    <th className="px-3 py-2">Mã trường</th>
                    <th className="px-3 py-2">Tên hiển thị</th>
                    <th className="px-3 py-2">Kiểu</th>
                    <th className="px-3 py-2">Nhóm</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {filteredAtomicFields.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-muted">
                        Không tìm thấy trường nào phù hợp
                      </td>
                    </tr>
                  ) : (
                    filteredAtomicFields.map((f) => {
                      const id = f.id || f.fieldCode
                      const isChecked = selectedMasterIds.has(id)
                      return (
                        <tr
                          key={id}
                          className={`hover:bg-slate-50 transition cursor-pointer ${
                            isChecked ? "bg-brand-soft/30" : ""
                          }`}
                          onClick={() => handleToggleSelectMaster(id)}
                        >
                          <td className="px-3 py-2 text-center" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleSelectMaster(id)}
                              className="size-4 rounded text-brand focus:ring-brand cursor-pointer"
                            />
                          </td>
                          <td className="px-3 py-2 font-mono font-bold text-brand">
                            {f.fieldCode}
                          </td>
                          <td className="px-3 py-2 font-medium text-slate-800">
                            {f.fieldName}
                          </td>
                          <td className="px-3 py-2">
                            <span className="inline-flex px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px]">
                              {f.dataType || "STRING"}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-slate-500 text-[11px]">
                            {f.category || "COMMON"}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 2. LỚP (OBJECT) */}
        {nodeType === "OBJECT" && (
          <div className="space-y-3 bg-purple-50/50 p-4 rounded-lg border border-purple-200">
            {masterClassOptions.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Chọn mẫu Lớp có sẵn từ Field Master (Tùy chọn)
                </label>
                <select
                  value={selectedMasterClassCode}
                  onChange={handleSelectMasterClass}
                  className="w-full rounded-lg border border-line bg-white px-3 py-2 text-xs focus:border-brand focus:outline-none"
                >
                  <option value="">-- Tạo mã lớp tùy chỉnh mới --</option>
                  {masterClassOptions.map((f) => (
                    <option key={f.fieldCode} value={f.fieldCode}>
                      {f.fieldCode} - {f.fieldName}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mã lớp <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={customClassCode}
                  onChange={(e) => setCustomClassCode(e.target.value)}
                  placeholder="Ví dụ: thong_tin_ca_nhan, hoc_tap"
                  className="w-full rounded-lg border border-line bg-white px-3 py-2 text-xs font-mono focus:border-brand focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tên lớp
                </label>
                <input
                  type="text"
                  value={customClassName}
                  onChange={(e) => setCustomClassName(e.target.value)}
                  placeholder="Ví dụ: Thông tin cá nhân"
                  className="w-full rounded-lg border border-line bg-white px-3 py-2 text-xs focus:border-brand focus:outline-none"
                />
              </div>
            </div>

            <p className="text-[11px] text-purple-700">
              * Lớp (OBJECT) đóng vai trò là một container tĩnh, cho phép bạn thêm các trường con hoặc lớp con vào bên trong sau khi tạo.
            </p>
          </div>
        )}

        {/* 3. LỚP LẶP (ARRAY) */}
        {nodeType === "ARRAY" && (
          <div className="space-y-3 bg-indigo-50/50 p-4 rounded-lg border border-indigo-200">
            {masterClassOptions.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Chọn mẫu Lớp lặp từ Field Master (Tùy chọn)
                </label>
                <select
                  value={selectedMasterClassCode}
                  onChange={handleSelectMasterClass}
                  className="w-full rounded-lg border border-line bg-white px-3 py-2 text-xs focus:border-brand focus:outline-none"
                >
                  <option value="">-- Tạo mã lớp lặp tùy chỉnh mới --</option>
                  {masterClassOptions.map((f) => (
                    <option key={f.fieldCode} value={f.fieldCode}>
                      {f.fieldCode} - {f.fieldName}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mã lớp lặp <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={customClassCode}
                  onChange={(e) => setCustomClassCode(e.target.value)}
                  placeholder="Ví dụ: danh_sach_khen_thuong"
                  className="w-full rounded-lg border border-line bg-white px-3 py-2 text-xs font-mono focus:border-brand focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tên lớp lặp
                </label>
                <input
                  type="text"
                  value={customClassName}
                  onChange={(e) => setCustomClassName(e.target.value)}
                  placeholder="Ví dụ: Danh sách khen thưởng"
                  className="w-full rounded-lg border border-line bg-white px-3 py-2 text-xs focus:border-brand focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kiểu dữ liệu 1 phần tử
                </label>
                <select
                  value={customArrayItemType}
                  onChange={(e) => setCustomArrayItemType(e.target.value)}
                  className="w-full rounded-lg border border-line bg-white px-3 py-2 text-xs focus:border-brand focus:outline-none"
                >
                  <option value="OBJECT">Object (Lớp phức hợp)</option>
                  <option value="STRING">String (Chuỗi ký tự)</option>
                  <option value="NUMBER">Number (Số)</option>
                  <option value="DATE">Date (Ngày tháng)</option>
                  <option value="FILE">File (Tệp minh chứng)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Min (Số dòng tối thiểu)
                </label>
                <input
                  type="number"
                  min="0"
                  value={customMin}
                  onChange={(e) => setCustomMin(e.target.value)}
                  className="w-full rounded-lg border border-line bg-white px-3 py-2 text-xs focus:border-brand focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Max (Số dòng tối đa)
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="Không giới hạn"
                  value={customMax}
                  onChange={(e) => setCustomMax(e.target.value)}
                  className="w-full rounded-lg border border-line bg-white px-3 py-2 text-xs focus:border-brand focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
