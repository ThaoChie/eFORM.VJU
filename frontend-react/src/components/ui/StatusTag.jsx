import { Check, Clock3, PenLine, RotateCcw } from "lucide-react"

export default function StatusTag({ status }) {
  const config = {
    "Soạn thảo": { icon: PenLine, style: "border-line bg-white text-muted" },
    "Chờ lớp duyệt": { icon: Clock3, style: "border-line bg-canvas text-ink" },
    "Đã chuyển trả": {
      icon: RotateCcw,
      style: "border-brand bg-white text-brand",
    },
    "Chờ khoa duyệt": { icon: Clock3, style: "border-line bg-line text-ink" },
    "Hoàn tất": { icon: Check, style: "border-night bg-night text-white" },
  }
  const item = config[status] ?? config["Soạn thảo"]
  const Icon = item.icon
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-medium ${item.style}`}
    >
      <Icon className="size-3.5" />
      {status}
    </span>
  )
}
