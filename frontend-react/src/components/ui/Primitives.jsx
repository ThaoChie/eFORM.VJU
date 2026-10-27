import {
  ArrowLeft,
  Check,
  CheckCircle,
  CircleOff,
  Eye,
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

export function IconButton({ label, children, className = "", ...props }) {
  return (
    <button
      aria-label={label}
      title={label}
      className={`inline-flex size-9 items-center justify-center rounded-lg text-muted hover:bg-canvas hover:text-ink transition disabled:opacity-45 ${className}`}
      {...props}
    >
      {children}
    </button>
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
        className={`h-10 w-full rounded-lg border bg-white px-3 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand-soft ${
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
  children,
  onSearch,
  cols = 4,
  buttonVariant = "primary",
  showSearchButton = true,
  searchButtonText = "Tìm kiếm",
}) {
  const gridClass = {
    1: "md:grid-cols-1",
    2: "md:grid-cols-2",
    3: "md:grid-cols-3",
    4: "md:grid-cols-4",
    5: "md:grid-cols-5",
  }[cols] || "md:grid-cols-4";

  return (
    <Card className="mb-4">
      <div className={`grid items-end gap-3 ${gridClass}`}>
        {children}
        {showSearchButton && (
          <div className="flex flex-col justify-end">
            <Button
              variant={buttonVariant}
              onClick={onSearch}
              className="w-full h-10"
            >
              <Search className="size-4 mr-1.5" />
              {searchButtonText}
            </Button>
          </div>
        )}
      </div>
    </Card>
  )
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

export function Table({ columns, rows = [], onRow, loading = false }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-line bg-white">
      <table className="w-full min-w-[760px] border-collapse text-left">
        <thead className="bg-canvas text-[13px] font-semibold">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className="h-12 whitespace-nowrap border-b border-line px-4"
              >
                {column.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td
                colSpan={columns.length}
                className="h-32 text-center text-sm text-muted py-8"
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
                className="h-32 text-center text-sm text-slate-500 py-8"
              >
                Không có dữ liệu
              </td>
            </tr>
          ) : (
            rows.map((row, index) => (
              <tr
                key={row.id ?? index}
                onClick={() => onRow?.(row)}
                className={`${
                  onRow ? "cursor-pointer" : ""
                } h-12 border-b border-line last:border-0 hover:bg-canvas`}
              >
                {columns.map((column) => (
                  <td key={column.key} className="px-4 py-3">
                    {column.render ? column.render(row, index) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
