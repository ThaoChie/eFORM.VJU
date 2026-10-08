import { Bell } from "lucide-react"
import { useEffect, useState } from "react"
import { useNotificationStore } from "../../stores/useNotificationStore"
import { Button, IconButton } from "./Primitives"

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const { items, load, markAll, markOne, push } = useNotificationStore()
  useEffect(() => {
    load()
    const timer = setInterval(push, 20000)
    return () => clearInterval(timer)
  }, [load, push])
  const unread = items.filter((item) => !item.read).length
  return (
    <div className="relative">
      <IconButton label="Thông báo" onClick={() => setOpen(!open)}>
        <Bell className="size-5" />
        {unread > 0 && (
          <span className="absolute right-0 top-0 flex min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-semibold text-white">
            {unread}
          </span>
        )}
      </IconButton>
      {open && (
        <div className="absolute right-0 top-11 z-40 w-[360px] overflow-hidden rounded-xl border border-line bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-line p-4">
            <span className="font-semibold">Thông báo</span>
            <Button
              variant="ghost"
              className="h-8 px-2 text-xs"
              onClick={markAll}
            >
              Đánh dấu đã đọc
            </Button>
          </div>
          <div className="max-h-[400px] overflow-auto">
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => markOne(item.id)}
                className="flex w-full gap-3 border-b border-line p-4 text-left hover:bg-canvas"
              >
                <span
                  className={`mt-1.5 size-2 shrink-0 rounded-full ${
                    item.read ? "bg-line" : "bg-brand"
                  }`}
                />
                <span>
                  <span
                    className={`block text-sm ${
                      item.read ? "text-muted" : "font-semibold text-ink"
                    }`}
                  >
                    {item.text}
                  </span>
                  <span className="mt-1 block text-xs text-muted">
                    {item.time}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
