export default function StatusTag({ status, className = "" }) {
  const normalizedStatus = {
    SUBMITTED: "Chờ lớp duyệt",
    CLASS_APPROVED: "Chờ khoa duyệt",
    DEAN_APPROVED: "Hoàn tất",
    REJECTED: "Đã chuyển trả",
    DRAFT: "Soạn thảo",
    ACTIVE: "Hiệu lực",
    INACTIVE: "Vô hiệu hóa",
  }[status] || status || "Chờ lớp duyệt"

  const config = {
    "Soạn thảo": { dot: "bg-slate-400", text: "text-slate-600" },
    "Chờ lớp duyệt": { dot: "bg-amber-500", text: "text-amber-700 font-medium" },
    "Chờ khoa duyệt": { dot: "bg-blue-500", text: "text-blue-700 font-medium" },
    "Đã chuyển trả": { dot: "bg-rose-500", text: "text-rose-700 font-medium" },
    "Hoàn tất": { dot: "bg-emerald-500", text: "text-emerald-700 font-medium" },
    "Hiệu lực": { dot: "bg-emerald-500", text: "text-emerald-700 font-medium" },
    "Vô hiệu hóa": { dot: "bg-rose-500", text: "text-rose-700 font-medium" },
    "Đang hoạt động": { dot: "bg-emerald-500", text: "text-emerald-700 font-medium" },
    "Đang mở": { dot: "bg-emerald-500", text: "text-emerald-700 font-medium" },
    "Chưa mở": { dot: "bg-slate-400", text: "text-slate-500" },
    "Đã đóng": { dot: "bg-slate-400", text: "text-slate-500" },
  }

  const item = config[normalizedStatus] || { dot: "bg-slate-400", text: "text-slate-600" }

  return (
    <div className={`inline-flex items-center gap-1.5 whitespace-nowrap text-xs ${item.text} ${className}`}>
      <span className={`size-1.5 rounded-full shrink-0 ${item.dot}`} />
      <span>{normalizedStatus}</span>
    </div>
  )
}
