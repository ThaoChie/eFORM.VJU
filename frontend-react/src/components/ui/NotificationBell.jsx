import {
  Bell,
  BellOff,
  CheckCheck,
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
import { IconButton } from "./Primitives"

export default function NotificationBell() {
  const navigate = useNavigate()
  const dropdownRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [filter, setFilter] = useState("all") // "all" | "unread"

  const { items, unreadCount, load, markAll, markOne, loading } =
    useNotificationStore()

  // Polling định kỳ mỗi 30s để cập nhật thông báo mới tự động
  useEffect(() => {
    load()
    const timer = setInterval(() => {
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

  // Chọn icon phù hợp với nội dung thông báo (ưu tiên trạng thái cần xử lý trước)
  const getItemIcon = (item) => {
    const text = `${item.title || ""} ${item.content || ""}`.toLowerCase()

    // 1. Từ chối / Trả lại -> Rose RotateCcw
    if (
      text.includes("từ chối") ||
      text.includes("trả lại") ||
      text.includes("chỉnh sửa") ||
      text.includes("không đạt")
    ) {
      return (
        <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600 border border-rose-200/80 shadow-xs">
          <RotateCcw className="size-4" />
        </span>
      )
    }

    // 2. Chờ duyệt / Cần duyệt / Nộp phiếu -> Amber Clock (chờ xử lý)
    if (
      text.includes("chờ duyệt") ||
      text.includes("cần duyệt") ||
      text.includes("yêu cầu duyệt") ||
      text.includes("nộp phiếu") ||
      text.includes("gửi duyệt") ||
      text.includes("chờ")
    ) {
      return (
        <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-200/80 shadow-xs">
          <Clock className="size-4" />
        </span>
      )
    }

    // 3. Phê duyệt thành công / Thông qua -> Emerald CheckCircle2
    if (
      text.includes("phê duyệt") ||
      text.includes("thông qua") ||
      text.includes("hoàn tất") ||
      text.includes("chấp thuận") ||
      text.includes("đã duyệt")
    ) {
      return (
        <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/80 shadow-xs">
          <CheckCircle2 className="size-4" />
        </span>
      )
    }

    // 4. Biểu mẫu / Kỳ chấm / Đợt mới -> Blue FileText
    if (
      text.includes("mới") ||
      text.includes("biểu mẫu") ||
      text.includes("kỳ chấm") ||
      text.includes("đợt")
    ) {
      return (
        <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-200/80 shadow-xs">
          <FileText className="size-4" />
        </span>
      )
    }

    // 5. Mặc định -> Indigo Sparkles
    return (
      <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200/80 shadow-xs">
        <Sparkles className="size-4" />
      </span>
    )
  }

  const displayedItems =
    filter === "unread" ? items.filter((item) => !item.read) : items

  return (
    <div className="relative" ref={dropdownRef}>
      <IconButton
        label="Thông báo"
        onClick={() => setOpen(!open)}
        className={`relative ${open ? "bg-slate-100 text-slate-900" : ""}`}
      >
        <Bell className="size-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-white animate-in zoom-in-50 duration-200">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </IconButton>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-[390px] sm:w-[420px] max-w-[calc(100vw-1.5rem)] rounded-2xl border border-slate-200/90 bg-white shadow-2xl ring-1 ring-black/5 overflow-hidden animate-in fade-in-50 slide-in-from-top-2 duration-150">
          {/* HEADER CHÍNH */}
          <div className="flex items-center justify-between border-b border-slate-100 bg-white px-4 py-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">Thông báo</h3>
              {unreadCount > 0 && (
                <span className="inline-flex items-center rounded-full bg-brand-soft px-2 py-0.5 text-[11px] font-semibold text-brand">
                  {unreadCount} mới
                </span>
              )}
            </div>
            {loading && (
              <span className="text-[11px] text-slate-400 animate-pulse">
                Đang cập nhật...
              </span>
            )}
          </div>

          {/* THANH ĐIỀU HƯỚNG TABS & HÀNH ĐỘNG */}
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/60 px-3.5 py-2">
            <div className="flex items-center gap-1 rounded-lg bg-slate-200/60 p-0.5">
              <button
                type="button"
                onClick={() => setFilter("all")}
                className={`rounded-md px-2.5 py-1 text-xs transition whitespace-nowrap ${
                  filter === "all"
                    ? "bg-white text-slate-900 shadow-xs font-semibold"
                    : "text-slate-600 hover:text-slate-900 font-medium"
                }`}
              >
                Tất cả ({items.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter("unread")}
                className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs transition whitespace-nowrap ${
                  filter === "unread"
                    ? "bg-white text-slate-900 shadow-xs font-semibold"
                    : "text-slate-600 hover:text-slate-900 font-medium"
                }`}
              >
                <span>Chưa đọc</span>
                {unreadCount > 0 && (
                  <span className="flex size-4 items-center justify-center rounded-full bg-brand text-[10px] font-bold text-white leading-none">
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAll}
                className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-brand hover:bg-white px-2 py-1 rounded-md transition whitespace-nowrap shrink-0 border border-transparent hover:border-slate-200/60 hover:shadow-xs"
                title="Đánh dấu tất cả là đã đọc"
              >
                <CheckCheck className="size-3.5" />
                <span>Đã đọc tất cả</span>
              </button>
            )}
          </div>

          {/* DANH SÁCH THÔNG BÁO */}
          <div className="max-h-[390px] overflow-y-auto divide-y divide-slate-100">
            {displayedItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-2.5">
                  <BellOff className="size-5" />
                </div>
                <p className="text-sm font-semibold text-slate-700">
                  {filter === "unread"
                    ? "Không có thông báo chưa đọc"
                    : "Chưa có thông báo nào"}
                </p>
                <p className="text-xs text-slate-400 mt-1 max-w-[260px]">
                  {filter === "unread"
                    ? "Bạn đã xem hết toàn bộ thông báo công việc."
                    : "Các thông báo về nộp, duyệt và trả phiếu sẽ xuất hiện tại đây."}
                </p>
              </div>
            ) : (
              displayedItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      handleItemClick(item)
                    }
                  }}
                  className={`group relative flex items-start gap-3 p-3.5 text-left transition-colors cursor-pointer ${
                    item.read
                      ? "bg-white hover:bg-slate-50/80 text-slate-600"
                      : "bg-brand-soft/20 hover:bg-brand-soft/30 text-slate-900"
                  }`}
                >
                  {/* Icon phân loại trạng thái */}
                  {getItemIcon(item)}

                  {/* Chi tiết nội dung */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className={`text-[13px] leading-snug ${
                          item.read
                            ? "font-medium text-slate-700"
                            : "font-semibold text-slate-900"
                        }`}
                      >
                        {item.title || "Thông báo hệ thống"}
                      </p>
                      {!item.read && (
                        <span
                          className="size-2 shrink-0 rounded-full bg-brand ring-4 ring-brand/15 mt-1"
                          title="Chưa đọc"
                        />
                      )}
                    </div>

                    {item.content && (
                      <p className="mt-1 text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {item.content}
                      </p>
                    )}

                    <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="size-3 text-slate-400" />
                        <span>{item.formattedTime || item.time || "Vừa xong"}</span>
                      </span>
                      {item.linkUrl && (
                        <span className="inline-flex items-center gap-1 font-medium text-brand group-hover:text-brand-dark transition-colors">
                          Xem chi tiết
                          <ExternalLink className="size-2.5 group-hover:translate-x-0.5 transition-transform" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* FOOTER DROPDOWN */}
          <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/70 px-4 py-2 text-[11px] text-slate-400">
            <span>Tự động làm mới mỗi 30s</span>
            <span>{items.length} thông báo</span>
          </div>
        </div>
      )}
    </div>
  )
}
