import { AlertCircle, Check, LoaderCircle } from "lucide-react"
import { useEffect, useState } from "react"
import { Button } from "../ui/Primitives"

export default function BatchSignProgress({ count = 12, onClose }) {
  const [done, setDone] = useState(0)
  const [finished, setFinished] = useState(false)
  const [retried, setRetried] = useState(false)
  useEffect(() => {
    if (finished) return
    const timer = setInterval(
      () =>
        setDone((value) => {
          if (value >= count) {
            clearInterval(timer)
            setFinished(true)
            return count
          }
          return value + 1
        }),
      180,
    )
    return () => clearInterval(timer)
  }, [count, finished])
  const rows = Array.from({ length: Math.min(count, 8) }, (_, i) => ({
    id: i,
    name: [
      "Trần Minh Anh",
      "Lê Hoàng Nam",
      "Ngô Thùy Dương",
      "Đỗ Gia Bảo",
      "Phan Hải Yến",
      "Trương Quốc Việt",
      "Bùi Khánh Linh",
      "Hoàng Đức Long",
    ][i],
    error: finished && !retried && [2, 6].includes(i),
  }))
  return (
    <div>
      <div className="rounded-lg bg-canvas p-4">
        <div className="flex justify-between">
          <b>Tiến trình ký lô</b>
          <span>
            {done} / {count}
          </span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-line">
          <div
            className="h-full bg-night transition-all"
            style={{ width: `${(done / count) * 100}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-muted">
          {finished
            ? `Thành công ${retried ? count : count - 2}, lỗi ${
                retried ? 0 : 2
              }`
            : "Đang chèn chữ ký và khóa chứng nhận..."}
        </p>
      </div>
      <div className="mt-4 max-h-72 overflow-auto rounded-lg border border-line">
        {rows.map((row, i) => (
          <div
            key={row.id}
            className="flex items-center gap-3 border-b border-line p-3 last:border-0"
          >
            <span className="w-5 text-xs text-muted">{i + 1}</span>
            <span className="flex-1">{row.name}</span>
            {row.error ? (
              <span className="inline-flex items-center gap-1 text-xs text-brand">
                <AlertCircle className="size-4" />
                Thiếu ảnh chữ ký
              </span>
            ) : i < done ? (
              <span className="inline-flex items-center gap-1 text-xs">
                <Check className="size-4" />
                Hoàn tất
              </span>
            ) : (
              <LoaderCircle className="size-4 animate-spin text-muted" />
            )}
          </div>
        ))}
      </div>
      {finished && (
        <div className="mt-4 flex justify-end gap-2">
          {!retried && (
            <Button variant="danger" onClick={() => setRetried(true)}>
              Thử lại các phiếu lỗi
            </Button>
          )}
          <Button variant="primary" onClick={onClose}>
            Đóng
          </Button>
        </div>
      )}
    </div>
  )
}
