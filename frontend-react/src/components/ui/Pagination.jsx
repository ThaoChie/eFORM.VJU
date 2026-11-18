import {
  ChevronDown,
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
      className={`flex flex-col sm:flex-row items-center justify-between gap-3 px-3 sm:px-4 py-3 border-t border-line bg-white select-none ${className}`}
    >
      {/* GÓC TRÁI: DROPDOWN CHỌN SỐ BẢN GHI & TEXT THÔNG TIN CHUẨN */}
      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 sm:gap-3 text-center sm:text-left">
        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span>Xem</span>
            <div className="relative inline-flex items-center">
              <select
                value={pageSize}
                onChange={(e) => {
                  const newSize = Number(e.target.value)
                  onPageSizeChange(newSize)
                  onPageChange?.(1)
                }}
                className="h-8 sm:h-7.5 appearance-none rounded-md border border-slate-200 bg-white pl-2.5 pr-6 text-xs font-medium text-slate-700 shadow-2xs hover:border-slate-300 hover:bg-slate-50/70 focus:border-brand focus:ring-2 focus:ring-brand/15 focus:outline-hidden transition cursor-pointer"
              >
                {pageSizeOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-1.5 size-3.5 text-slate-400" />
            </div>
            <span>bản ghi / trang</span>
          </div>
        )}

        {onPageSizeChange && (
          <span className="hidden sm:inline-block h-3.5 w-px bg-slate-200" />
        )}

        <span className="text-xs text-slate-500">
          Hiển thị từ <span className="font-semibold text-slate-800">{from}</span>{" "}
          đến <span className="font-semibold text-slate-800">{to}</span> trong{" "}
          <span className="font-semibold text-slate-800">{totalItems}</span> bản
          ghi
        </span>
      </div>

      {/* CỤM ĐIỀU HƯỚNG BÊN PHẢI ĐẦY ĐỦ CÁC NÚT BẤM (RESPONSIVE TOUCH-TARGET >= 44px) */}
      <div className="flex items-center gap-1 sm:gap-1.5 w-full sm:w-auto justify-center sm:justify-end">
        {/* Về trang đầu (<<) */}
        <button
          type="button"
          title="Về trang đầu"
          disabled={safeCurrentPage <= 1}
          onClick={() => onPageChange?.(1)}
          className="inline-flex min-h-[44px] min-w-[40px] sm:min-h-0 sm:min-w-0 sm:size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-slate-600 transition disabled:cursor-not-allowed active:scale-95"
        >
          <ChevronsLeft className="size-4" />
        </button>

        {/* Trang trước (<) */}
        <button
          type="button"
          title="Trang trước"
          disabled={safeCurrentPage <= 1}
          onClick={() => onPageChange?.(Math.max(1, safeCurrentPage - 1))}
          className="inline-flex min-h-[44px] min-w-[40px] sm:min-h-0 sm:min-w-0 sm:size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-slate-600 transition disabled:cursor-not-allowed active:scale-95"
        >
          <ChevronLeft className="size-4" />
        </button>

        {/* Mobile: Hiển thị tóm tắt trang gọn gàng không bị tràn ngang */}
        <div className="sm:hidden flex items-center justify-center px-2 text-xs font-semibold text-slate-700 min-h-[44px]">
          <span>{safeCurrentPage} / {totalPages}</span>
        </div>

        {/* Desktop / Tablet: Danh sách số trang dạng nút bấm trực quan */}
        <div className="hidden sm:inline-flex items-center gap-1">
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
                className={`inline-flex size-8 items-center justify-center rounded-lg text-xs font-semibold transition active:scale-95 ${
                  p === safeCurrentPage
                    ? "bg-brand text-white shadow-xs"
                    : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                {p}
              </button>
            )
          )}
        </div>

        {/* Trang sau (>) */}
        <button
          type="button"
          title="Trang sau"
          disabled={safeCurrentPage >= totalPages}
          onClick={() => onPageChange?.(Math.min(totalPages, safeCurrentPage + 1))}
          className="inline-flex min-h-[44px] min-w-[40px] sm:min-h-0 sm:min-w-0 sm:size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-slate-600 transition disabled:cursor-not-allowed active:scale-95"
        >
          <ChevronRight className="size-4" />
        </button>

        {/* Về trang cuối (>>) */}
        <button
          type="button"
          title="Về trang cuối"
          disabled={safeCurrentPage >= totalPages}
          onClick={() => onPageChange?.(totalPages)}
          className="inline-flex min-h-[44px] min-w-[40px] sm:min-h-0 sm:min-w-0 sm:size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-slate-600 transition disabled:cursor-not-allowed active:scale-95"
        >
          <ChevronsRight className="size-4" />
        </button>
      </div>
    </div>
  )
}
