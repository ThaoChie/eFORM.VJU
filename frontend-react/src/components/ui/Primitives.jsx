import React, { useState } from "react"
import {
  ArrowLeft,
  Check,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  CircleOff,
  Eye,
  Filter,
  LoaderCircle,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Send,
  Trash2,
  X,
} from "lucide-react"

export function Button({
  children,
  variant = "secondary",
  loading,
  className = "",
  ...props
}) {
  const styles = {
    primary: "border-brand bg-brand text-white hover:bg-brand-dark active:bg-brand-dark",
    secondary: "border-line bg-white text-ink hover:bg-canvas active:bg-canvas",
    danger: "border-brand bg-white text-brand hover:bg-brand-soft active:bg-brand-soft",
    ghost:
      "border-transparent bg-transparent text-muted hover:bg-canvas hover:text-ink",
  }
  return (
    <button
      className={`inline-flex min-h-[44px] sm:min-h-10 h-11 sm:h-10 items-center justify-center gap-2 rounded-lg border px-4 text-sm font-medium transition disabled:opacity-45 select-none active:scale-[0.98] ${styles[variant]} ${className}`}
      {...props}
    >
      {loading && <LoaderCircle className="size-4 animate-spin shrink-0" />}
      {children}
    </button>
  )
}

export function IconButton({
  label,
  title,
  children,
  className = "",
  tooltipPlacement = "top",
  tooltipAlign = "center",
  disabled,
  ...props
}) {
  const tooltipText = label || title

  const alignStyles = {
    center: "left-1/2 -translate-x-1/2 tooltip-auto-align",
    right: "right-0 translate-x-0",
    left: "left-0 translate-x-0",
  }

  const arrowAlignStyles = {
    center: "left-1/2 -translate-x-1/2 tooltip-arrow-auto-align",
    right: "right-3 translate-x-0",
    left: "left-3 translate-x-0",
  }

  let positionClass = `bottom-full mb-1.5 ${alignStyles[tooltipAlign] || alignStyles.center}`
  let arrowClass = `top-full -mt-0.5 border-t-slate-300 border-b-transparent border-l-transparent border-r-transparent ${arrowAlignStyles[tooltipAlign] || arrowAlignStyles.center}`

  if (tooltipPlacement === "bottom") {
    positionClass = `top-full mt-1.5 ${alignStyles[tooltipAlign] || alignStyles.center}`
    arrowClass = `bottom-full -mb-0.5 border-b-slate-300 border-t-transparent border-l-transparent border-r-transparent ${arrowAlignStyles[tooltipAlign] || arrowAlignStyles.center}`
  } else if (tooltipPlacement === "right") {
    positionClass = "left-full ml-2 top-1/2 -translate-y-1/2"
    arrowClass = "right-full top-1/2 -translate-y-1/2 border-r-slate-300 border-l-transparent border-t-transparent border-b-transparent"
  } else if (tooltipPlacement === "left") {
    positionClass = "right-full mr-2 top-1/2 -translate-y-1/2"
    arrowClass = "left-full top-1/2 -translate-y-1/2 border-l-slate-300 border-r-transparent border-t-transparent border-b-transparent"
  }

  const isMlAuto = className.includes("ml-auto")
  const isMrAuto = className.includes("mr-auto")
  const isMr2 = className.includes("mr-2")
  const isMr3 = className.includes("mr-3")

  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 group/btn ${isMlAuto ? "ml-auto" : ""} ${isMrAuto ? "mr-auto" : ""} ${isMr2 ? "mr-2" : ""} ${isMr3 ? "mr-3" : ""}`}>
      <button
        type="button"
        aria-label={tooltipText}
        disabled={disabled}
        className={`inline-flex min-h-[44px] min-w-[44px] sm:min-h-9 sm:min-w-9 size-11 sm:size-9 items-center justify-center rounded-lg text-muted hover:bg-canvas hover:text-ink transition disabled:opacity-45 select-none active:scale-95 ${className}`}
        {...props}
      >
        {children}
      </button>
      {tooltipText && (
        <span
          role="tooltip"
          className={`pointer-events-none absolute ${positionClass} hidden group-hover/btn:inline-flex items-center justify-center whitespace-nowrap rounded-md bg-slate-100 border border-slate-300/90 px-2.5 py-1 text-[11px] font-medium text-slate-700 shadow-md z-[100]`}
        >
          {tooltipText}
          <span
            className={`absolute border-4 ${arrowClass}`}
          />
        </span>
      )}
    </div>
  )
}

// ============================================================================
// CÁC BUTTON CHUẨN ĐỒNG BỘ TOÀN HỆ THỐNG (Lấy DirectoryPage - Danh bạ đơn vị làm gốc)
// ============================================================================

// 1. Cột thao tác (Action Column Buttons)
export function ActionViewButton({ label = "Xem chi tiết", onClick, className = "", ...props }) {
  return (
    <IconButton
      label={label}
      onClick={onClick}
      className={`hover:text-brand ${className}`}
      {...props}
    >
      <Eye className="size-4" />
    </IconButton>
  )
}

export function ActionEditButton({ label = "Chỉnh sửa", onClick, className = "", ...props }) {
  return (
    <IconButton
      label={label}
      onClick={onClick}
      className={`hover:text-brand ${className}`}
      {...props}
    >
      <Pencil className="size-4" />
    </IconButton>
  )
}

export function ActionDeactivateButton({ label = "Vô hiệu hóa", onClick, className = "", tooltipAlign = "right", ...props }) {
  return (
    <IconButton
      label={label}
      tooltipAlign={tooltipAlign}
      onClick={onClick}
      className={`hover:text-rose-600 hover:bg-rose-50 ${className}`}
      {...props}
    >
      <CircleOff className="size-4 text-rose-500" />
    </IconButton>
  )
}

export function ActionActivateButton({ label = "Kích hoạt", onClick, className = "", tooltipAlign = "right", ...props }) {
  return (
    <IconButton
      label={label}
      tooltipAlign={tooltipAlign}
      onClick={onClick}
      className={`hover:text-emerald-600 hover:bg-emerald-50 ${className}`}
      {...props}
    >
      <CheckCircle className="size-4 text-emerald-500" />
    </IconButton>
  )
}

export function ActionDeleteButton({ label = "Xóa", onClick, className = "", tooltipAlign = "right", ...props }) {
  return (
    <IconButton
      label={label}
      tooltipAlign={tooltipAlign}
      onClick={onClick}
      className={`hover:text-rose-600 hover:bg-rose-50 ${className}`}
      {...props}
    >
      <Trash2 className="size-4 text-rose-500" />
    </IconButton>
  )
}

// 2. Các Button chính chuẩn (Main System Buttons)
export function CreateButton({ children = "Thêm mới", onClick, className = "", ...props }) {
  return (
    <Button variant="primary" onClick={onClick} className={className} {...props}>
      <Plus className="size-4" />
      {children}
    </Button>
  )
}

export function BackButton({ children = "Quay lại", onClick, className = "", ...props }) {
  return (
    <Button variant="secondary" onClick={onClick} className={className} {...props}>
      <ArrowLeft className="size-4" />
      {children}
    </Button>
  )
}

export function SubmitButton({ children = "Đẩy duyệt", onClick, loading, className = "", ...props }) {
  return (
    <Button variant="primary" onClick={onClick} loading={loading} className={className} {...props}>
      <Send className="size-4" />
      {children}
    </Button>
  )
}

export function ConfirmButton({ children = "Xác nhận", onClick, loading, className = "", ...props }) {
  return (
    <Button variant="primary" onClick={onClick} loading={loading} className={className} {...props}>
      <Check className="size-4" />
      {children}
    </Button>
  )
}

export function CancelButton({ children = "Hủy", onClick, className = "", ...props }) {
  return (
    <Button variant="secondary" onClick={onClick} className={className} {...props}>
      {children}
    </Button>
  )
}

export function SearchButton({ children = "Tìm kiếm", onClick, type = "submit", className = "", ...props }) {
  return (
    <Button variant="primary" type={type} onClick={onClick} className={className} {...props}>
      <Search className="size-4" />
      {children}
    </Button>
  )
}

export function ResetFilterButton({ children = "Xóa bộ lọc", onClick, className = "", ...props }) {
  return (
    <Button variant="ghost" onClick={onClick} className={className} {...props}>
      <RotateCcw className="size-4" />
      {children}
    </Button>
  )
}

export function Input({ label, required, error, className = "", ...props }) {
  return (
    <label className={`block space-y-1.5 ${className}`}>
      {label && (
        <span className="text-xs font-medium text-muted">
          {label}
          {required && <span className="text-brand"> *</span>}
        </span>
      )}
      <input
        className={`h-11 sm:h-10 text-base sm:text-sm w-full rounded-lg border bg-white px-3 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand-soft disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed ${
          error ? "border-brand" : "border-line"
        }`}
        {...props}
      />
      {error && <span className="block text-xs text-brand">{error}</span>}
    </label>
  )
}

export function Select({ label, children, className = "", ...props }) {
  return (
    <label className={`block space-y-1.5 ${className}`}>
      {label && <span className="text-xs font-medium text-muted">{label}</span>}
      <select
        className="h-11 sm:h-10 text-base sm:text-sm w-full rounded-lg border border-line bg-white px-3 outline-none focus:border-brand focus:ring-2 focus:ring-brand-soft"
        {...props}
      >
        {children}
      </select>
    </label>
  )
}

export function Textarea({ label, value = "", maxLength, error, className = "", ...props }) {
  return (
    <label className="block space-y-1.5">
      {label && <span className="text-xs font-medium text-muted">{label}</span>}
      <textarea
        value={value}
        maxLength={maxLength}
        className={`min-h-24 w-full resize-y rounded-lg border bg-white p-3 text-base sm:text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand-soft leading-relaxed ${
          error ? "border-brand" : "border-line"
        } ${className}`}
        {...props}
      />
      <span
        className={`flex text-xs ${
          error ? "justify-between text-brand" : "justify-end text-muted"
        }`}
      >
        {error && <span>{error}</span>}
        {maxLength && (
          <span>
            {value.length} / {maxLength}
          </span>
        )}
      </span>
    </label>
  )
}

export function Card({ children, className = "" }) {
  return (
    <section
      className={`rounded-xl sm:rounded-lg border border-line bg-white p-3.5 sm:p-5 ${className}`}
    >
      {children}
    </section>
  )
}

export function PageTitle({ title, description, action }) {
  return (
    <div className="mb-4 sm:mb-5 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
      <div className="min-w-0">
        <h1 className="text-xl sm:text-[22px] font-semibold leading-7 sm:leading-8 text-ink truncate sm:whitespace-normal">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-xs sm:text-sm text-muted">{description}</p>
        )}
      </div>
      {action && (
        <div className="flex flex-wrap items-center gap-2 shrink-0 w-full sm:w-auto">
          {action}
        </div>
      )}
    </div>
  )
}

export function FilterBar({
  searchQuery,
  onSearchChange,
  searchPlaceholder = "Tìm kiếm theo tên hoặc mã...",
  onSearch,
  onReset,
  children,
  extraFilterCount = 0,
  isOpen,
  onToggle,
  defaultOpen = false,
  showSearchButton = true,
  showResetButton = true,
  showFilterButton = true,
  searchButtonText = "Tìm kiếm",
  resetButtonText = "Xóa bộ lọc",
  filterButtonText = "Bộ lọc",
  cols = 4,
  className = "",
}) {
  const [localOpen, setLocalOpen] = useState(defaultOpen);
  const showFilters = isOpen !== undefined ? isOpen : localOpen;
  const toggleFilters = onToggle || (() => setLocalOpen((prev) => !prev));

  const hasChildren = Boolean(children);

  const gridClass = {
    1: "grid-cols-1",
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 md:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
    5: "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5",
  }[cols] || "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4";

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onSearch?.();
    }
  };

  return (
    <Card className={`mb-4 ${className}`}>
      {/* Hàng tìm kiếm chính */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Input
            placeholder={searchPlaceholder}
            value={searchQuery ?? ""}
            onChange={(e) => onSearchChange?.(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
          {showSearchButton && (
            <Button
              variant="primary"
              type="button"
              onClick={onSearch}
              className="gap-1.5"
            >
              <Search className="size-4" />
              {searchButtonText}
            </Button>
          )}

          {showResetButton && onReset && (
            <Button
              variant="secondary"
              type="button"
              onClick={onReset}
              className="gap-1.5"
            >
              <RotateCcw className="size-4" />
              {resetButtonText}
            </Button>
          )}

          {hasChildren && showFilterButton && (
            <Button
              variant={showFilters ? "primary" : "secondary"}
              type="button"
              onClick={toggleFilters}
              className="gap-1.5"
            >
              <Filter className="size-4" />
              {filterButtonText}
              {extraFilterCount > 0 && (
                <span
                  className={`inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-xs font-semibold ${
                    showFilters
                      ? "bg-white text-brand"
                      : "bg-brand/10 text-brand"
                  }`}
                >
                  {extraFilterCount}
                </span>
              )}
              {showFilters ? (
                <ChevronUp className="size-4" />
              ) : (
                <ChevronDown className="size-4" />
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Khối bộ lọc mở rộng xổ ra khi ấn nút Bộ lọc */}
      {hasChildren && showFilters && (
        <div className="mt-4 pt-4 border-t border-line animate-in fade-in slide-in-from-top-1 duration-200">
          <div className={`grid gap-3 ${gridClass}`}>
            {children}
          </div>
        </div>
      )}
    </Card>
  );
}

export function Modal({
  open,
  title,
  children,
  onClose,
  footer,
  wide = false,
}) {
  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-night/45 p-0 sm:p-4 backdrop-blur-xs transition-opacity"
      onMouseDown={onClose}
    >
      <div
        className={`max-h-[92vh] sm:max-h-[90vh] w-full overflow-hidden rounded-t-2xl sm:rounded-xl border border-line bg-white shadow-xl flex flex-col ${
          wide ? "max-w-4xl" : "max-w-lg"
        }`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex h-14 sm:h-16 items-center justify-between border-b border-line px-4 sm:px-6 shrink-0 bg-white">
          <h2 className="text-base font-semibold truncate pr-2">{title}</h2>
          <IconButton label="Đóng" onClick={onClose}>
            <X className="size-5" />
          </IconButton>
        </div>
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 text-sm">{children}</div>
        {footer && (
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 border-t border-line px-4 sm:px-6 py-3 sm:py-4 shrink-0 bg-slate-50/50">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

export function Table({
  columns = [],
  rows = [],
  onRow,
  loading = false,
  emptyMessage = "Không có dữ liệu",
  stickyFirstColumns = true,
}) {
  const isSttFirst =
    columns[0]?.key?.toLowerCase() === "stt" ||
    columns[0]?.title?.trim()?.toUpperCase() === "STT";

  // Calculate sticky and width for each column
  const STT_WIDTH = 64;
  const CODE_WIDTH = 150;
  const NAME_WIDTH = 220;

  const colConfigs = columns.map((col, idx) => {
    let isStickyLeft = false;
    let stickyLeft = 0;
    let isLastStickyLeft = false;

    let isStickyRight = false;
    let stickyRight = 0;

    const key = (col.key || "").toLowerCase();
    const title = (col.title || "").toLowerCase();

    // Check sticky right for Action / Thao tác
    const isAction = key === "action" || key === "actions" || title.includes("thao tác") || col.sticky === "right";
    if (isAction && columns.length > 3) {
      isStickyRight = true;
      stickyRight = 0;
    }

    if (col.sticky === "left" || col.sticky === true) {
      isStickyLeft = true;
    } else if (stickyFirstColumns && isSttFirst && idx < 3 && columns.length > 3 && !isAction) {
      isStickyLeft = true;
    }

    if (isStickyLeft) {
      if (idx === 0) {
        stickyLeft = 0;
      } else if (idx === 1) {
        stickyLeft = STT_WIDTH;
      } else if (idx === 2) {
        stickyLeft = STT_WIDTH + CODE_WIDTH;
        isLastStickyLeft = true;
      }
    }

    // Determine generous width
    let widthClass = "min-w-[170px]";

    if (col.width) {
      widthClass = col.width;
    } else if (idx === 0 && (isSttFirst || key === "stt")) {
      widthClass = "w-16 min-w-[64px] max-w-[64px] text-center";
    } else if (idx === 1 && isStickyLeft) {
      widthClass = "w-40 min-w-[150px]";
    } else if (idx === 2 && isStickyLeft) {
      widthClass = "w-56 min-w-[220px]";
    } else if (isAction) {
      widthClass = "w-36 min-w-[130px] text-center";
    } else if (title.includes("ngày sinh") || key.includes("dob") || key.includes("date")) {
      widthClass = "min-w-[130px]";
    } else if (title.includes("email") || key.includes("email")) {
      widthClass = "min-w-[220px]";
    } else if (title.includes("ngành") || key.includes("major")) {
      widthClass = "min-w-[220px]";
    } else if (
      title.includes("khoa") ||
      title.includes("phòng") ||
      key.includes("dept") ||
      key.includes("department") ||
      key.includes("office")
    ) {
      widthClass = "min-w-[220px]";
    } else if (title.includes("niên khóa") || key.includes("cohort")) {
      widthClass = "min-w-[150px]";
    } else if (title.includes("vai trò") || key.includes("role")) {
      widthClass = "min-w-[140px]";
    } else if (title.includes("trạng thái") || key.includes("status")) {
      widthClass = "min-w-[160px]";
    } else if (title.includes("sĩ số") || title.includes("số lớp") || key.includes("count")) {
      widthClass = "min-w-[100px] text-center";
    } else if (title.includes("trưởng") || title.includes("phó") || key.includes("leader") || key.includes("deputy")) {
      widthClass = "min-w-[200px]";
    }

    return {
      isStickyLeft,
      stickyLeft,
      isLastStickyLeft,
      isStickyRight,
      stickyRight,
      widthClass,
    };
  });

  return (
    <div className="overflow-x-auto rounded-lg border border-line bg-white custom-scrollbar">
      <table className="w-max min-w-full border-separate border-spacing-0 text-left">
        <thead className="bg-canvas text-xs font-semibold uppercase tracking-wider text-muted">
          <tr>
            {columns.map((column, idx) => {
              const cfg = colConfigs[idx] || {};
              const style = cfg.isStickyLeft
                ? { left: `${cfg.stickyLeft}px` }
                : cfg.isStickyRight
                ? { right: `${cfg.stickyRight}px` }
                : undefined;
              return (
                <th
                  key={column.key ?? idx}
                  style={style}
                  className={`h-12 whitespace-nowrap border-b border-line px-3 sm:px-4 select-none ${cfg.widthClass} ${
                    cfg.isStickyLeft
                      ? `md:sticky z-20 bg-canvas ${
                          cfg.isLastStickyLeft
                            ? "md:border-r md:border-line md:shadow-[4px_0_8px_-2px_rgba(0,0,0,0.07)]"
                            : ""
                        }`
                      : cfg.isStickyRight
                      ? "md:sticky md:right-0 z-20 bg-canvas md:border-l md:border-line md:shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.07)]"
                      : "bg-canvas"
                  }`}
                >
                  {column.title}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td
                colSpan={columns.length}
                className="h-32 text-center text-sm text-muted py-8 bg-white"
              >
                <div className="inline-flex items-center gap-2">
                  <LoaderCircle className="size-5 animate-spin text-brand" />
                  <span>Đang tải dữ liệu...</span>
                </div>
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="h-32 text-center text-sm text-slate-500 py-8 bg-white"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row, index) => (
              <tr
                key={row.id ?? index}
                onClick={() => onRow?.(row)}
                className={`group group/row ${
                  onRow ? "cursor-pointer" : ""
                } h-12 transition-colors hover:bg-canvas relative hover:z-50`}
              >
                {columns.map((column, idx) => {
                  const cfg = colConfigs[idx] || {};
                  const style = cfg.isStickyLeft
                    ? { left: `${cfg.stickyLeft}px` }
                    : cfg.isStickyRight
                    ? { right: `${cfg.stickyRight}px` }
                    : undefined;
                  return (
                    <td
                      key={column.key ?? idx}
                      style={style}
                      className={`px-3 sm:px-4 py-3 sm:py-3.5 border-b border-line text-xs sm:text-sm ${cfg.widthClass} ${
                        cfg.isStickyLeft
                          ? `md:sticky z-10 bg-white group-hover:bg-canvas transition-colors ${
                              cfg.isLastStickyLeft
                                ? "md:border-r md:border-line md:shadow-[4px_0_8px_-2px_rgba(0,0,0,0.07)]"
                                : ""
                            }`
                          : cfg.isStickyRight
                          ? "md:sticky md:right-0 z-10 bg-white group-hover:bg-canvas group-hover/row:z-50 hover:z-50 transition-colors md:border-l md:border-line md:shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.07)]"
                          : "bg-white group-hover:bg-canvas group-hover/row:z-40 hover:z-50 transition-colors"
                      }`}
                    >
                      {column.render
                        ? column.render(row, index)
                        : (row[column.key] ?? "—")}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}


export { default as Pagination } from "./Pagination"
