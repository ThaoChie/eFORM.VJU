import React, { useState } from "react"
import {
  FolderKanban,
  ListTree,
  FileText,
  ChevronDown,
  ChevronRight,
  PlusCircle,
  Sliders,
  MoveUp,
  MoveDown,
  Trash2,
  Copy,
  ClipboardPaste,
  XCircle,
  Calendar,
  Layers,
  CheckCircle2,
  AlertCircle
} from "lucide-react"
import { Button, IconButton } from "../../../../components/ui/Primitives"

export default function FieldTreeTable({
  nodes = [],
  onOpenClassConfig,
  onOpenAddChildNode,
  onDeleteNode,
  onMoveUp,
  onMoveDown,
  onDuplicateNode,
  onPasteNode
}) {
  const [expandedNodes, setExpandedNodes] = useState(() => {
    // Expand root classes by default
    const set = new Set()
    nodes.forEach((n) => set.add(n.id || n.fieldCode))
    return set
  })

  // Clipboard node for Copy/Paste workflow
  const [clipboardNode, setClipboardNode] = useState(null)

  const toggleExpand = (id) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleCopyNode = (node) => {
    setClipboardNode(node)
  }

  const handleClearClipboard = () => {
    setClipboardNode(null)
  }

  const handlePasteInto = (targetParentCode = null) => {
    if (clipboardNode && onPasteNode) {
      onPasteNode(clipboardNode, targetParentCode)
    }
  }

  // Recursive renderer for table rows
  const renderRow = (node, index, totalInLevel, depth = 0) => {
    const isClass =
      node.isClass || node.dataType === "OBJECT" || node.dataType === "ARRAY"
    const isArray = node.classType === "ARRAY" || node.dataType === "ARRAY"
    const hasChildren = node.children && node.children.length > 0
    const nodeId = node.id || node.fieldCode
    const isExpanded = expandedNodes.has(nodeId)

    return (
      <React.Fragment key={nodeId}>
        <tr
          className={`hover:bg-slate-50 transition border-b border-line ${
            clipboardNode && clipboardNode.fieldCode === node.fieldCode
              ? "bg-amber-50/50"
              : isClass
              ? "bg-slate-50/40 font-medium"
              : ""
          }`}
        >
          {/* STT */}
          <td className="px-3 py-3 text-xs text-muted w-12 text-center">
            {depth === 0 ? index + 1 : `${depth}.${index + 1}`}
          </td>

          {/* MÃ TRƯỜNG / LỚP (CÂY PHÂN CẤP) */}
          <td className="px-3 py-3">
            <div
              className="flex items-center gap-1.5"
              style={{ paddingLeft: `${depth * 20}px` }}
            >
              {isClass ? (
                <button
                  type="button"
                  onClick={() => toggleExpand(nodeId)}
                  className="p-1 text-slate-400 hover:text-slate-800 transition rounded"
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

              {isClass ? (
                isArray ? (
                  <ListTree className="size-4 text-indigo-600 shrink-0" />
                ) : (
                  <FolderKanban className="size-4 text-purple-600 shrink-0" />
                )
              ) : (
                <FileText className="size-4 text-slate-400 shrink-0" />
              )}

              <span className="font-mono text-xs font-bold text-brand">
                {node.fieldCode}
              </span>

              {isClass && (
                <span className="ml-1 text-[11px] text-muted">
                  ({node.children ? node.children.length : 0} con)
                </span>
              )}
            </div>
          </td>

          {/* TÊN HIỂN THỊ */}
          <td className="px-3 py-3 text-xs text-slate-800 font-medium">
            {node.fieldName || node.fieldCode}
          </td>

          {/* NHÓM / PHÂN LOẠI */}
          <td className="px-3 py-3 text-xs text-slate-600">
            {node.category || (isClass ? "CLASS" : "COMMON")}
          </td>

          {/* KIỂU DỮ LIỆU */}
          <td className="px-3 py-3 text-xs">
            {isClass ? (
              isArray ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  <ListTree className="size-3" />
                  ARRAY (Lớp lặp)
                  {node.itemType && ` [${node.itemType}]`}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                  <FolderKanban className="size-3" />
                  OBJECT (Lớp)
                </span>
              )
            ) : (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
                {node.dataType || "STRING"}
              </span>
            )}
          </td>

          {/* BẮT BUỘC / HIỆU LỰC */}
          <td className="px-3 py-3 text-xs">
            {isClass ? (
              <span
                className={`inline-flex items-center gap-1 font-medium ${
                  node.isActive !== false ? "text-emerald-600" : "text-slate-400"
                }`}
              >
                {node.isActive !== false ? "Hiệu lực" : "Tắt"}
                {node.validationRules && node.validationRules.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 rounded text-[10px] bg-amber-100 text-amber-800 font-semibold">
                    {node.validationRules.length} rules
                  </span>
                )}
              </span>
            ) : node.isRequired ? (
              <span className="text-brand font-semibold">Bắt buộc</span>
            ) : (
              <span className="text-slate-400">Tùy chọn</span>
            )}
          </td>

          {/* THAO TÁC THEO MỤC 33 CỦA RSD */}
          <td className="px-3 py-3 text-right">
            <div className="flex items-center justify-end gap-1">
              {/* Nút Cấu hình lớp (chỉ cho Object / Array) */}
              {isClass && (
                <IconButton
                  label="Cấu hình lớp"
                  onClick={() => onOpenClassConfig(node)}
                  className="size-7 hover:text-brand hover:bg-brand-soft"
                >
                  <Sliders className="size-3.5 text-brand" />
                </IconButton>
              )}

              {/* Nút Thêm phần tử con (chỉ cho Object / Array) */}
              {isClass && (
                <IconButton
                  label="Thêm phần tử con vào lớp"
                  onClick={() => onOpenAddChildNode(node)}
                  className="size-7 hover:text-emerald-600 hover:bg-emerald-50"
                >
                  <PlusCircle className="size-3.5 text-emerald-600" />
                </IconButton>
              )}

              {/* Dán vào lớp này (nếu có clipboard và là Object) */}
              {clipboardNode && isClass && !isArray && (
                <IconButton
                  label={`Dán "${clipboardNode.fieldCode}" vào lớp này`}
                  onClick={() => handlePasteInto(node.fieldCode)}
                  className="size-7 text-indigo-600 hover:bg-indigo-50"
                >
                  <ClipboardPaste className="size-3.5" />
                </IconButton>
              )}

              {/* Di chuyển lên */}
              <IconButton
                label="Di chuyển lên"
                disabled={index === 0}
                onClick={() => onMoveUp && onMoveUp(node, depth)}
                className="size-7 hover:text-slate-900 disabled:opacity-20"
              >
                <MoveUp className="size-3.5" />
              </IconButton>

              {/* Di chuyển xuống */}
              <IconButton
                label="Di chuyển xuống"
                disabled={index === totalInLevel - 1}
                onClick={() => onMoveDown && onMoveDown(node, depth)}
                className="size-7 hover:text-slate-900 disabled:opacity-20"
              >
                <MoveDown className="size-3.5" />
              </IconButton>

              {/* Sao chép node */}
              <IconButton
                label="Sao chép node này"
                onClick={() => handleCopyNode(node)}
                className="size-7 hover:text-slate-900"
              >
                <Copy className="size-3.5" />
              </IconButton>

              {/* Xóa */}
              <IconButton
                label="Xóa"
                onClick={() => onDeleteNode(node)}
                className="size-7 hover:text-red-600 hover:bg-red-50"
              >
                <Trash2 className="size-3.5 text-slate-400 hover:text-red-600" />
              </IconButton>
            </div>
          </td>
        </tr>

        {/* Render child rows if expanded */}
        {hasChildren &&
          isExpanded &&
          node.children.map((child, cIdx) =>
            renderRow(child, cIdx, node.children.length, depth + 1)
          )}
      </React.Fragment>
    )
  }

  return (
    <div className="space-y-3">
      {/* CLIPBOARD BAR (KHI ĐANG SAO CHÉP NODE) */}
      {clipboardNode && (
        <div className="flex items-center justify-between bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg text-xs">
          <div className="flex items-center gap-2">
            <Copy className="size-4 text-amber-600" />
            <span>
              Đã sao chép node:{" "}
              <strong className="font-mono text-amber-900">
                {clipboardNode.fieldCode}
              </strong>{" "}
              ({clipboardNode.fieldName})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              className="text-xs h-7 px-2.5 text-indigo-700 bg-white"
              onClick={() => handlePasteInto(null)}
            >
              <ClipboardPaste className="size-3.5 mr-1 text-indigo-600" />
              Dán vào gốc
            </Button>
            <Button
              variant="ghost"
              className="text-xs h-7 px-2 text-slate-600 hover:text-red-600"
              onClick={handleClearClipboard}
            >
              <XCircle className="size-3.5 mr-1" />
              Bỏ sao chép
            </Button>
          </div>
        </div>
      )}

      {/* TABLE */}
      <div className="overflow-x-auto rounded-lg border border-line bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-canvas font-semibold text-slate-700 text-xs uppercase tracking-wider">
            <tr>
              <th className="px-3 py-3 w-12 text-center">STT</th>
              <th className="px-3 py-3">Mã trường / Cấu trúc Lớp</th>
              <th className="px-3 py-3">Tên hiển thị</th>
              <th className="px-3 py-3">Nhóm</th>
              <th className="px-3 py-3">Kiểu dữ liệu</th>
              <th className="px-3 py-3">Bắt buộc / Hiệu lực</th>
              <th className="px-3 py-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {nodes.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-muted">
                  <Layers className="size-8 mx-auto mb-2 text-slate-300" />
                  <p className="font-medium text-slate-700 text-xs">
                    Chưa có trường thông tin hoặc cấu trúc lớp nào
                  </p>
                  <p className="text-[11px] text-muted mt-0.5">
                    Bấm "Thêm node vào cây" hoặc "Sao chép từ biểu mẫu khác" để cấu hình.
                  </p>
                </td>
              </tr>
            ) : (
              nodes.map((node, idx) =>
                renderRow(node, idx, nodes.length, 0)
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
