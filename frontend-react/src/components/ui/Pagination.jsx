import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react"

/**
 * Component Phân trang chuẩn thiết kế (Pagination)
 * - Dropdown chọn số bản ghi ở góc trái (mặc định 10, tùy chọn 25, 50)
 * - Text thông tin chuẩn: "Hiển thị từ [from] đến [to] trong [total] bản ghi"
 * - Cụm điều hướng bên phải đầy đủ: Về trang đầu (<<), Trang trước (<), Danh sách số trang dạng nút bấm (active nổi bật), Trang sau (>), Về trang cuối (>>)
 */
export default function Pagination({
  currentPage = 1,
  pageSize = 10,
  totalItems = 0,
  pageSizeOptions = [10, 25, 50],
  onPageChange,
  onPageSizeChange,
  className = "",
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages)

  const from = totalItems === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1
  const to = Math.min(safeCurrentPage * pageSize, totalItems)

  // Tạo danh sách trang hiển thị trực quan (kèm dấu ...)
  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }

    if (safeCurrentPage <= 4) {
      return [1, 2, 3, 4, 5, "...", totalPages]
    }

    if (safeCurrentPage >= totalPages - 3) {
      return [
        1,
        "...",
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ]
    }

    return [
      1,
      "...",
      safeCurrentPage - 1,
      safeCurrentPage,
      safeCurrentPage + 1,
      "...",
      totalPages,
    ]
  }

  const pages = getPageNumbers()

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-line bg-white ${className}`}
    >
      {/* GÓC TRÁI: DROPDOWN CHỌN SỐ BẢN GHI & TEXT THÔNG TIN CHUẨN */}
      <div className="flex flex-wrap items-center gap-4">
        {onPageSizeChange && (
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span className="text-muted">Xem</span>
            <select
              value={pageSize}
              onChange={(e) => {
                const newSize = Number(e.target.value)
                onPageSizeChange(newSize)
                onPageChange?.(1)
              }}
              className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-800 shadow-2xs cursor-pointer hover:border-slate-300 focus:border-brand focus:outline-hidden"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            <span className="text-muted">bản ghi / trang</span>
          </div>
        )}

        <span className="text-xs text-slate-600">
          Hiển thị từ <span className="font-semibold text-slate-800">{from}</span>{" "}
          đến <span className="font-semibold text-slate-800">{to}</span> trong{" "}
          <span className="font-semibold text-slate-800">{totalItems}</span> bản
          ghi
        </span>
      </div>

      {/* CỤM ĐIỀU HƯỚNG BÊN PHẢI ĐẦY ĐỦ CÁC NÚT BẤM */}
      <div className="flex items-center gap-1">
        {/* Về trang đầu (<<) */}
        <button
          type="button"
          title="Về trang đầu"
          disabled={safeCurrentPage <= 1}
          onClick={() => onPageChange?.(1)}
          className="inline-flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-slate-600 transition disabled:cursor-not-allowed"
        >
          <ChevronsLeft className="size-4" />
        </button>

        {/* Trang trước (<) */}
        <button
          type="button"
          title="Trang trước"
          disabled={safeCurrentPage <= 1}
          onClick={() => onPageChange?.(Math.max(1, safeCurrentPage - 1))}
          className="inline-flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-slate-600 transition disabled:cursor-not-allowed"
        >
          <ChevronLeft className="size-4" />
        </button>

        {/* Danh sách số trang dạng nút bấm trực quan (active state có nền nổi bật) */}
        {pages.map((p, idx) =>
          p === "..." ? (
            <span
              key={`ellipsis-${idx}`}
              className="flex size-8 items-center justify-center text-xs text-slate-400 select-none"
            >
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange?.(p)}
              className={`inline-flex size-8 items-center justify-center rounded-lg text-xs font-semibold transition ${
                p === safeCurrentPage
                  ? "bg-brand text-white shadow-xs"
                  : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              {p}
            </button>
          )
        )}

        {/* Trang sau (>) */}
        <button
          type="button"
          title="Trang sau"
          disabled={safeCurrentPage >= totalPages}
          onClick={() => onPageChange?.(Math.min(totalPages, safeCurrentPage + 1))}
          className="inline-flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-slate-600 transition disabled:cursor-not-allowed"
        >
          <ChevronRight className="size-4" />
        </button>

        {/* Về trang cuối (>>) */}
        <button
          type="button"
          title="Về trang cuối"
          disabled={safeCurrentPage >= totalPages}
          onClick={() => onPageChange?.(totalPages)}
          className="inline-flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-slate-600 transition disabled:cursor-not-allowed"
        >
          <ChevronsRight className="size-4" />
        </button>
      </div>
    </div>
  )
}
