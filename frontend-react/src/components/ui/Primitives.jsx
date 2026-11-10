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
    primary: "border-brand bg-brand text-white hover:bg-brand-dark",
    secondary: "border-line bg-white text-ink hover:bg-canvas",
    danger: "border-brand bg-white text-brand hover:bg-brand-soft",
    ghost:
      "border-transparent bg-transparent text-muted hover:bg-canvas hover:text-ink",
  }
  return (
    <button
      className={`inline-flex h-10 items-center justify-center gap-2 rounded-lg border px-4 text-sm font-medium transition disabled:opacity-45 ${styles[variant]} ${className}`}
      {...props}
    >
      {loading && <LoaderCircle className="size-4 animate-spin" />}
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
  const isBottom = tooltipPlacement === "bottom"

  const alignStyles = {
    center: "left-1/2 -translate-x-1/2",
    right: "right-0 translate-x-0",
    left: "left-0 translate-x-0",
  }

  const arrowAlignStyles = {
    center: "left-1/2 -translate-x-1/2",
    right: "right-3 translate-x-0",
    left: "left-3 translate-x-0",
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
        title={tooltipText}
        disabled={disabled}
        className={`inline-flex size-9 items-center justify-center rounded-lg text-muted hover:bg-canvas hover:text-ink transition disabled:opacity-45 ${className}`}
        {...props}
      >
        {children}
      </button>
      {tooltipText && (
        <span
          role="tooltip"
          className={`pointer-events-none absolute ${
            isBottom ? "top-full mt-1.5" : "bottom-full mb-1.5"
          } ${
            alignStyles[tooltipAlign] || alignStyles.center
          } hidden group-hover/btn:inline-flex items-center justify-center whitespace-nowrap rounded-md bg-slate-900 px-2.5 py-1 text-[11px] font-medium text-white shadow-xl ring-1 ring-white/10 z-[100]`}
        >
          {tooltipText}
          <span
            className={`absolute ${
              isBottom
                ? "bottom-full -mb-0.5 border-b-slate-900 border-t-transparent"
                : "top-full -mt-0.5 border-t-slate-900 border-b-transparent"
            } ${
              arrowAlignStyles[tooltipAlign] || arrowAlignStyles.center
            } border-4 border-l-transparent border-r-transparent`}
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

export function ActionDeactivateButton({ label = "Vô hiệu hóa", onClick, className = "", ...props }) {
  return (
    <IconButton
      label={label}
      onClick={onClick}
      className={`hover:text-rose-600 hover:bg-rose-50 ${className}`}
      {...props}
    >
      <CircleOff className="size-4 text-rose-500" />
    </IconButton>
  )
}

export function ActionActivateButton({ label = "Kích hoạt", onClick, className = "", ...props }) {
  return (
    <IconButton
      label={label}
      onClick={onClick}
      className={`hover:text-emerald-600 hover:bg-emerald-50 ${className}`}
      {...props}
    >
      <CheckCircle className="size-4 text-emerald-500" />
    </IconButton>
  )
}

export function ActionDeleteButton({ label = "Xóa", onClick, className = "", ...props }) {
  return (
    <IconButton
      label={label}
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
        className={`h-10 w-full rounded-lg border bg-white px-3 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand-soft disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed ${
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
        className="h-10 w-full rounded-lg border border-line bg-white px-3 outline-none focus:border-brand focus:ring-2 focus:ring-brand-soft"
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
        className={`min-h-24 w-full resize-y rounded-lg border bg-white p-2.5 text-xs outline-none transition focus:border-brand focus:ring-2 focus:ring-brand-soft leading-relaxed ${
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
      className={`rounded-lg border border-line bg-white p-5 ${className}`}
    >
      {children}
    </section>
  )
}

export function PageTitle({ title, description, action }) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-[22px] font-semibold leading-8 text-ink">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-muted">{description}</p>
        )}
      </div>
      {action}
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-night/45 p-4"
      onMouseDown={onClose}
    >
      <div
        className={`max-h-[90vh] w-full overflow-auto rounded-xl border border-line bg-white shadow-xl ${
          wide ? "max-w-4xl" : "max-w-lg"
        }`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex h-16 items-center justify-between border-b border-line px-6">
          <h2 className="text-base font-semibold">{title}</h2>
          <IconButton label="Đóng" onClick={onClose}>
            <X className="size-5" />
          </IconButton>
        </div>
        <div className="p-6">{children}</div>
        {footer && (
          <div className="flex justify-end gap-3 border-t border-line px-6 py-4">
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
    const isAction = key === "action" || title.includes("thao tác") || col.sticky === "right";
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
      widthClass = "w-28 min-w-[110px] text-center";
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
                  className={`h-12 whitespace-nowrap border-b border-line px-4 select-none ${cfg.widthClass} ${
                    cfg.isStickyLeft
                      ? `sticky z-20 bg-canvas ${
                          cfg.isLastStickyLeft
                            ? "border-r border-line shadow-[4px_0_8px_-2px_rgba(0,0,0,0.07)]"
                            : ""
                        }`
                      : cfg.isStickyRight
                      ? "sticky right-0 z-20 bg-canvas border-l border-line shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.07)]"
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
                className={`group ${
                  onRow ? "cursor-pointer" : ""
                } h-12 transition-colors hover:bg-canvas`}
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
                      className={`px-4 py-3.5 border-b border-line text-sm ${cfg.widthClass} ${
                        cfg.isStickyLeft
                          ? `sticky z-10 bg-white group-hover:bg-canvas transition-colors ${
                              cfg.isLastStickyLeft
                                ? "border-r border-line shadow-[4px_0_8px_-2px_rgba(0,0,0,0.07)]"
                                : ""
                            }`
                          : cfg.isStickyRight
                          ? "sticky right-0 z-10 bg-white group-hover:bg-canvas transition-colors border-l border-line shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.07)]"
                          : "bg-white group-hover:bg-canvas transition-colors"
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
