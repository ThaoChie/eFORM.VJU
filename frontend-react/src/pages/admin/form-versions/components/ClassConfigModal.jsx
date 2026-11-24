import React, { useState, useEffect } from "react"
import {
  Sliders,
  Calendar,
  Layers,
  Plus,
  Trash2,
  FileCode,
  CheckCircle,
  AlertCircle,
  Info
} from "lucide-react"
import { Button, Modal } from "../../../../components/ui/Primitives"

const DEFAULT_RULE_TYPES = [
  { value: "AT_LEAST_ONE", label: "Ít nhất 1 trong các field" },
  { value: "EXACTLY_ONE", label: "Chính xác 1 trong các field" },
  { value: "ALL_OR_NONE", label: "Nhập 1 🡪 phải nhập đủ" },
  { value: "CUSTOM", label: "Tùy chọn khác" }
]

const VALUE_LIMIT_RULES = [
  { value: "SUM_LESS_THAN", label: "Tổng < giới hạn" },
  { value: "SUM_GREATER_THAN", label: "Tổng > giới hạn" },
  { value: "SUM_EQUALS", label: "Tổng = giá trị cố định" },
  { value: "PATTERN", label: "Pattern (Regex)" },
  { value: "EXPRESSION", label: "Biểu thức tự do" }
]

const ARRAY_ITEM_TYPES = [
  { value: "OBJECT", label: "Object (Lớp phức hợp)" },
  { value: "STRING", label: "String (Chuỗi ký tự)" },
  { value: "NUMBER", label: "Number (Số)" },
  { value: "DATE", label: "Date (Ngày tháng)" },
  { value: "FILE", label: "File (Minh chứng / Tệp đính kèm)" }
]

export default function ClassConfigModal({
  open,
  onClose,
  classNode,
  onSaveClassConfig,
  availableSubFields = []
}) {
  const [activeTab, setActiveTab] = useState("VISUAL") // "VISUAL" | "JSON"

  // Class fields state
  const [effectiveFrom, setEffectiveFrom] = useState("")
  const [effectiveTo, setEffectiveTo] = useState("")
  const [isActive, setIsActive] = useState(true)

  // Array specific
  const [itemType, setItemType] = useState("OBJECT")
  const [min, setMin] = useState(0)
  const [max, setMax] = useState("")

  // Render condition & change reason
  const [renderCondition, setRenderCondition] = useState("")
  const [changeReason, setChangeReason] = useState("")

  // Validation rules (Visual list & JSON string)
  const [visualRules, setVisualRules] = useState([])
  const [rawJsonRules, setRawJsonRules] = useState("[]")
  const [jsonError, setJsonError] = useState(null)

  // Populate from classNode when modal opens
  useEffect(() => {
    if (open && classNode) {
      setEffectiveFrom(classNode.effectiveFrom || "")
      setEffectiveTo(classNode.effectiveTo || "")
      setIsActive(classNode.isActive !== false)

      setItemType(classNode.itemType || "OBJECT")
      setMin(classNode.min !== undefined ? classNode.min : 0)
      setMax(classNode.max !== undefined && classNode.max !== null ? classNode.max : "")

      setRenderCondition(classNode.renderCondition || "")
      setChangeReason(classNode.changeReason || "")

      const rules = Array.isArray(classNode.validationRules)
        ? classNode.validationRules
        : []
      setVisualRules(rules)
      setRawJsonRules(JSON.stringify(rules, null, 2))
      setJsonError(null)
      setActiveTab("VISUAL")
    }
  }, [open, classNode])

  // Sync Visual -> JSON
  const handleVisualRulesChange = (updatedRules) => {
    setVisualRules(updatedRules)
    setRawJsonRules(JSON.stringify(updatedRules, null, 2))
    setJsonError(null)
  }

  // Add rule in Visual tab
  const handleAddRule = () => {
    const newRule = {
      id: `rule_${Date.now()}`,
      fieldRule: "AT_LEAST_ONE",
      appliedFields: "",
      valueLimitRule: "SUM_LESS_THAN",
      limitValue: "",
      pattern: "",
      customExpression: "",
      failMessage: "Dữ liệu không thỏa mãn điều kiện ràng buộc của lớp"
    }
    handleVisualRulesChange([...visualRules, newRule])
  }

  // Update specific rule
  const handleUpdateRule = (index, key, val) => {
    const next = [...visualRules]
    next[index] = { ...next[index], [key]: val }
    handleVisualRulesChange(next)
  }

  // Remove rule
  const handleRemoveRule = (index) => {
    const next = visualRules.filter((_, idx) => idx !== index)
    handleVisualRulesChange(next)
  }

  // Sync JSON -> Visual
  const handleJsonChange = (text) => {
    setRawJsonRules(text)
    try {
      const parsed = JSON.parse(text)
      if (Array.isArray(parsed)) {
        setVisualRules(parsed)
        setJsonError(null)
      } else {
        setJsonError("JSON phải là một mảng các rule ([ ... ])")
      }
    } catch (e) {
      setJsonError("Định dạng JSON không hợp lệ: " + e.message)
    }
  }

  // Save config
  const handleSave = () => {
    if (jsonError) {
      setActiveTab("JSON")
      return
    }

    let finalRules = visualRules
    if (activeTab === "JSON") {
      try {
        finalRules = JSON.parse(rawJsonRules)
      } catch (e) {
        setJsonError("JSON chưa đúng cú pháp")
        return
      }
    }

    const isArrayType =
      classNode?.classType === "ARRAY" || classNode?.dataType === "ARRAY"

    const updatedNode = {
      ...classNode,
      effectiveFrom,
      effectiveTo,
      isActive,
      renderCondition,
      changeReason,
      validationRules: finalRules,
      ...(isArrayType
        ? {
            itemType,
            min: Number(min) || 0,
            max: max === "" ? null : Number(max)
          }
        : {})
    }

    onSaveClassConfig(updatedNode)
    onClose()
  }

  if (!open || !classNode) return null

  const isArray =
    classNode.classType === "ARRAY" || classNode.dataType === "ARRAY"

  return (
    <Modal
      open={open}
      title={
        <div className="flex items-center gap-2">
          <Sliders className="size-5 text-brand" />
          <span>
            Cấu hình lớp:{" "}
            <span className="font-mono text-brand">
              {classNode.fieldCode}
            </span>{" "}
            ({isArray ? "Lớp lặp Array" : "Lớp Object"})
          </span>
        </div>
      }
      onClose={onClose}
      className="max-w-3xl"
      footer={
        <div className="flex w-full items-center justify-between">
          <Button variant="secondary" onClick={onClose}>
            Hủy
          </Button>
          <Button variant="primary" onClick={handleSave}>
            Lưu cấu hình
          </Button>
        </div>
      }
    >
      <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
        {/* ROW 1: Mã lớp & Tên lớp (READ ONLY) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Mã lớp
            </label>
            <input
              type="text"
              readOnly
              value={classNode.fieldCode || ""}
              className="w-full rounded-lg border border-line bg-slate-100 px-3 py-2 text-xs font-mono text-slate-600 cursor-not-allowed select-all"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tên lớp
            </label>
            <input
              type="text"
              readOnly
              value={classNode.fieldName || classNode.fieldCode || ""}
              className="w-full rounded-lg border border-line bg-slate-100 px-3 py-2 text-xs text-slate-600 cursor-not-allowed"
            />
          </div>
        </div>

        {/* ROW 2: Hiệu lực từ, Đến, Kích hoạt */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end bg-slate-50 p-3 rounded-lg border border-line">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Hiệu lực từ
            </label>
            <input
              type="date"
              value={effectiveFrom}
              onChange={(e) => setEffectiveFrom(e.target.value)}
              className="w-full rounded-lg border border-line bg-white px-3 py-2 text-xs focus:border-brand focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Đến (để trống nếu vô thời hạn)
            </label>
            <input
              type="date"
              value={effectiveTo}
              onChange={(e) => setEffectiveTo(e.target.value)}
              className="w-full rounded-lg border border-line bg-white px-3 py-2 text-xs focus:border-brand focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Kích hoạt
            </label>
            <div className="flex items-center gap-3 h-9">
              <button
                type="button"
                onClick={() => setIsActive(!isActive)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                  isActive ? "bg-brand" : "bg-slate-300"
                }`}
              >
                <span
                  className={`inline-block size-4 transform rounded-full bg-white transition-transform ${
                    isActive ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
              <span className="text-xs font-medium text-slate-700">
                {isActive ? "Đang bật" : "Tắt (Vô hiệu)"}
              </span>
            </div>
          </div>
        </div>

        {/* ROW 3: Khi là Lớp lặp ARRAY (Kiểu dữ liệu 1 phần tử, Min, Max) */}
        {isArray && (
          <div className="bg-indigo-50/60 p-3 rounded-lg border border-indigo-200 space-y-3">
            <div className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="size-4 text-indigo-600" />
              Cấu hình Lớp lặp (Array)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kiểu dữ liệu của 1 phần tử
                </label>
                <select
                  value={itemType}
                  onChange={(e) => setItemType(e.target.value)}
                  className="w-full rounded-lg border border-line bg-white px-3 py-2 text-xs focus:border-brand focus:outline-none"
                >
                  {ARRAY_ITEM_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Min (Số phần tử tối thiểu)
                </label>
                <input
                  type="number"
                  min="0"
                  value={min}
                  onChange={(e) => setMin(e.target.value)}
                  className="w-full rounded-lg border border-line bg-white px-3 py-2 text-xs focus:border-brand focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Max (Số phần tử tối đa)
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="Không giới hạn"
                  value={max}
                  onChange={(e) => setMax(e.target.value)}
                  className="w-full rounded-lg border border-line bg-white px-3 py-2 text-xs focus:border-brand focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* ROW 4: Điều kiện render */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Điều kiện render
          </label>
          <textarea
            rows={2}
            value={renderCondition}
            onChange={(e) => setRenderCondition(e.target.value)}
            placeholder="Ví dụ: role === 'STUDENT' && semester === 'HK1'"
            className="w-full rounded-lg border border-line px-3 py-2 text-xs font-mono focus:border-brand focus:outline-none"
          />
        </div>

        {/* ROW 5: Validate lớp (2 tab Trực quan & Json) */}
        <div className="border border-line rounded-lg overflow-hidden">
          <div className="bg-slate-50 px-3 py-2 border-b border-line flex items-center justify-between">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Validate lớp ({visualRules.length} rules)
            </div>
            <div className="flex items-center gap-1 bg-white border border-line rounded-lg p-0.5">
              <button
                type="button"
                onClick={() => setActiveTab("VISUAL")}
                className={`px-3 py-1 rounded text-xs font-medium transition ${
                  activeTab === "VISUAL"
                    ? "bg-brand text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Trực quan
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("JSON")}
                className={`px-3 py-1 rounded text-xs font-medium transition ${
                  activeTab === "JSON"
                    ? "bg-brand text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                JSON
              </button>
            </div>
          </div>

          <div className="p-3">
            {activeTab === "VISUAL" ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted">
                    Thiết lập các điều kiện kiểm tra hợp lệ cho các field bên trong lớp này.
                  </span>
                  <Button
                    variant="secondary"
                    className="text-xs h-7 px-2.5"
                    onClick={handleAddRule}
                  >
                    <Plus className="size-3.5 mr-1 text-brand" />
                    Thêm rule
                  </Button>
                </div>

                {visualRules.length === 0 ? (
                  <div className="p-4 text-center text-xs text-muted border border-dashed border-slate-200 rounded-lg">
                    Chưa có rule validation nào. Bấm "Thêm rule" để thiết lập.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {visualRules.map((rule, idx) => (
                      <div
                        key={rule.id || idx}
                        className="rounded-lg border border-slate-200 bg-white p-3 shadow-xs space-y-3 relative"
                      >
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                          <span className="font-bold text-xs text-brand">
                            Rule #{idx + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveRule(idx)}
                            className="text-slate-400 hover:text-red-600 transition p-1"
                            title="Xóa rule này"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                              Rule trong các field
                            </label>
                            <select
                              value={rule.fieldRule || "AT_LEAST_ONE"}
                              onChange={(e) =>
                                handleUpdateRule(idx, "fieldRule", e.target.value)
                              }
                              className="w-full rounded border border-line bg-white px-2 py-1.5 text-xs focus:border-brand focus:outline-none"
                            >
                              {DEFAULT_RULE_TYPES.map((rt) => (
                                <option key={rt.value} value={rt.value}>
                                  {rt.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                              Áp dụng cho (Danh sách mã field)
                            </label>
                            <input
                              type="text"
                              value={rule.appliedFields || ""}
                              onChange={(e) =>
                                handleUpdateRule(
                                  idx,
                                  "appliedFields",
                                  e.target.value
                                )
                              }
                              placeholder="Ví dụ: score_1_1, score_1_2"
                              className="w-full rounded border border-line px-2 py-1.5 text-xs focus:border-brand focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                              Rule giới hạn giá trị
                            </label>
                            <select
                              value={rule.valueLimitRule || "SUM_LESS_THAN"}
                              onChange={(e) =>
                                handleUpdateRule(
                                  idx,
                                  "valueLimitRule",
                                  e.target.value
                                )
                              }
                              className="w-full rounded border border-line bg-white px-2 py-1.5 text-xs focus:border-brand focus:outline-none"
                            >
                              {VALUE_LIMIT_RULES.map((vl) => (
                                <option key={vl.value} value={vl.value}>
                                  {vl.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            {rule.valueLimitRule === "PATTERN" ? (
                              <>
                                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                  Pattern (Regex)
                                </label>
                                <input
                                  type="text"
                                  value={rule.pattern || ""}
                                  onChange={(e) =>
                                    handleUpdateRule(idx, "pattern", e.target.value)
                                  }
                                  placeholder="^[0-9]+$"
                                  className="w-full rounded border border-line px-2 py-1.5 text-xs font-mono focus:border-brand focus:outline-none"
                                />
                              </>
                            ) : rule.valueLimitRule === "EXPRESSION" ? (
                              <>
                                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                  Biểu thức tự do
                                </label>
                                <input
                                  type="text"
                                  value={rule.customExpression || ""}
                                  onChange={(e) =>
                                    handleUpdateRule(
                                      idx,
                                      "customExpression",
                                      e.target.value
                                    )
                                  }
                                  placeholder="fieldA + fieldB <= 100"
                                  className="w-full rounded border border-line px-2 py-1.5 text-xs font-mono focus:border-brand focus:outline-none"
                                />
                              </>
                            ) : (
                              <>
                                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                  Giá trị giới hạn
                                </label>
                                <input
                                  type="text"
                                  value={rule.limitValue || ""}
                                  onChange={(e) =>
                                    handleUpdateRule(
                                      idx,
                                      "limitValue",
                                      e.target.value
                                    )
                                  }
                                  placeholder="Ví dụ: 100"
                                  className="w-full rounded border border-line px-2 py-1.5 text-xs focus:border-brand focus:outline-none"
                                />
                              </>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Thông báo khi rule fail
                          </label>
                          <input
                            type="text"
                            value={rule.failMessage || ""}
                            onChange={(e) =>
                              handleUpdateRule(idx, "failMessage", e.target.value)
                            }
                            placeholder="Nhập câu cảnh báo lỗi..."
                            className="w-full rounded border border-line px-2 py-1.5 text-xs text-red-600 focus:border-brand focus:outline-none"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted">
                    Chỉnh sửa cấu trúc JSON thô của các rule:
                  </span>
                  {jsonError && (
                    <span className="text-xs text-red-600 font-semibold flex items-center gap-1">
                      <AlertCircle className="size-3.5" />
                      {jsonError}
                    </span>
                  )}
                </div>
                <textarea
                  rows={8}
                  value={rawJsonRules}
                  onChange={(e) => handleJsonChange(e.target.value)}
                  className={`w-full font-mono text-xs p-3 rounded-lg border bg-slate-900 text-emerald-400 focus:outline-none ${
                    jsonError ? "border-red-500" : "border-slate-800"
                  }`}
                />
              </div>
            )}
          </div>
        </div>

        {/* ROW 6: Lý do thay đổi (lớp này) */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Lý do thay đổi (lớp này)
          </label>
          <input
            type="text"
            value={changeReason}
            onChange={(e) => setChangeReason(e.target.value)}
            placeholder="Nhập ghi chú hoặc lý do điều chỉnh cấu hình lớp..."
            className="w-full rounded-lg border border-line px-3 py-2 text-xs focus:border-brand focus:outline-none"
          />
        </div>
      </div>
    </Modal>
  )
}
