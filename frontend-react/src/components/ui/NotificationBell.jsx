import {
  Bell,
  BellOff,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  RotateCcw,
  Sparkles,
} from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useNotificationStore } from "../../stores/useNotificationStore"
import { Button, IconButton } from "./Primitives"

export default function NotificationBell() {
  const navigate = useNavigate()
  const dropdownRef = useRef(null)
  const [open, setOpen] = useState(false)

  const { items, unreadCount, load, markAll, markOne, loading } =
    useNotificationStore()

  // Polling định kỳ mỗi 30s để cập nhật thông báo mới tự động
  useEffect(() => {
    load()
    const timer = setInterval(() => {
      // Chỉ poll khi user đang có token đăng nhập
      if (localStorage.getItem("token")) {
        load()
      }
    }, 30000)
    return () => clearInterval(timer)
  }, [load])

  // Tự động đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [open])

  // Xử lý khi nhấn vào một thông báo
  const handleItemClick = (item) => {
    markOne(item.id)
    if (item.linkUrl && item.linkUrl.trim() !== "") {
      setOpen(false)
      if (item.linkUrl.startsWith("/")) {
        navigate(item.linkUrl)
      } else {
        window.open(item.linkUrl, "_blank")
      }
    }
  }

  // Chọn icon phù hợp với nội dung thông báo
  const getItemIcon = (item) => {
    const text = `${item.title || ""} ${item.content || ""}`.toLowerCase()
    if (text.includes("từ chối") || text.includes("trả lại")) {
      return (
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-600 border border-rose-200">
          <RotateCcw className="size-3.5" />
        </span>
      )
    }
    if (text.includes("phê duyệt") || text.includes("thông qua") || text.includes("hoàn tất")) {
      return (
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
          <CheckCircle2 className="size-3.5" />
        </span>
      )
    }
    if (text.includes("mới") || text.includes("nộp phiếu") || text.includes("chờ duyệt")) {
      return (
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 border border-blue-200">
          <FileText className="size-3.5" />
        </span>
      )
    }
    return (
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200">
        <Sparkles className="size-3.5" />
      </span>
    )
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <IconButton
        label="Thông báo"
        onClick={() => setOpen(!open)}
        className="relative"
      >
        <Bell className="size-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-white animate-in zoom-in-50 duration-200">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </IconButton>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-[380px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl animate-in fade-in-50 slide-in-from-top-2 duration-150">
          {/* HEADER DROPDOWN */}
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-800">Thông báo công việc</span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[11px] font-semibold text-brand">
                  {unreadCount} chưa đọc
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                className="h-7 px-2 text-xs text-brand hover:text-brand-dark hover:bg-brand-soft"
                onClick={markAll}
              >
                <Check className="size-3.5 mr-1" />
                Đã đọc tất cả
              </Button>
            )}
          </div>

          {/* LIST NỘI DUNG */}
          <div className="max-h-[420px] overflow-y-auto divide-y divide-slate-100">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                <div className="flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-2">
                  <BellOff className="size-6" />
                </div>
                <p className="text-sm font-medium text-slate-700">Chưa có thông báo nào</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Các thông báo về nộp, duyệt và trả phiếu sẽ xuất hiện tại đây.
                </p>
              </div>
            ) : (
              items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleItemClick(item)}
                  className={`flex w-full items-start gap-3 p-3.5 text-left transition ${
                    item.read
                      ? "bg-white hover:bg-slate-50 text-slate-600"
                      : "bg-blue-50/40 hover:bg-blue-50/70 text-slate-900"
                  }`}
                >
                  {getItemIcon(item)}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className={`text-xs ${
                          item.read ? "font-medium text-slate-800" : "font-bold text-slate-900"
                        }`}
                      >
                        {item.title || "Thông báo hệ thống"}
                      </p>
                      {!item.read && (
                        <span className="size-2 shrink-0 rounded-full bg-brand mt-1" />
                      )}
                    </div>
                    {item.content && (
                      <p className="mt-1 text-xs text-slate-600 line-clamp-2">
                        {item.content}
                      </p>
                    )}
                    <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-slate-400">
                      <Clock className="size-3" />
                      <span>{item.formattedTime || item.time || "Vừa xong"}</span>
                      {item.linkUrl && (
                        <>
                          <span>•</span>
                          <span className="inline-flex items-center gap-0.5 text-brand hover:underline font-medium">
                            Xem chi tiết <ExternalLink className="size-2.5" />
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
