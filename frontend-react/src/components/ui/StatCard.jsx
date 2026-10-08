import { ArrowUpRight } from "lucide-react"
import { Card } from "./Primitives"

export default function StatCard({ label, value, note }) {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <span className="text-sm text-muted">{label}</span>
        <ArrowUpRight className="size-4 text-disabled" />
      </div>
      <div className="mt-3 text-[28px] font-semibold leading-9 text-night">
        {value}
      </div>
      {note && <div className="mt-1 text-xs text-muted">{note}</div>}
    </Card>
  )
}
