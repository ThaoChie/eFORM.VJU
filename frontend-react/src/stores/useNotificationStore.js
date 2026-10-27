import { create } from "zustand"
import { notificationService } from "../services/notification-service"

export function formatNotificationTime(dateStr) {
  if (!dateStr) return "Vừa xong"
  try {
    const d = new Date(dateStr)
    const now = new Date()
    const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000)
    if (diffSec < 60) return "Vừa xong"
    const diffMin = Math.floor(diffSec / 60)
    if (diffMin < 60) return `${diffMin} phút trước`
    const diffHour = Math.floor(diffMin / 60)
    if (diffHour < 24) return `${diffHour} giờ trước`
    const diffDay = Math.floor(diffHour / 24)
    if (diffDay < 7) return `${diffDay} ngày trước`
    return d.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return "Vừa xong"
  }
}

export const useNotificationStore = create((set, get) => ({
  items: [],
  unreadCount: 0,
  total: 0,
  loading: false,

  async load() {
    try {
      set({ loading: true })
      const res = await notificationService.list(0, 30)
      const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : [])
      const unread = typeof res?.unreadCount === "number" 
        ? res.unreadCount 
        : list.filter((n) => !n.isRead && !n.read).length

      set({
        items: list.map((item) => ({
          ...item,
          read: Boolean(item.isRead ?? item.read),
          formattedTime: formatNotificationTime(item.createdAt),
        })),
        unreadCount: unread,
        total: res?.total || list.length,
      })
    } catch (err) {
      console.warn("Lỗi khi tải thông báo:", err)
    } finally {
      set({ loading: false })
    }
  },

  async markOne(id) {
    try {
      const prevItems = get().items
      const target = prevItems.find((i) => i.id === id)
      if (target && !target.read) {
        set({
          items: prevItems.map((item) =>
            item.id === id ? { ...item, read: true, isRead: true } : item
          ),
          unreadCount: Math.max(0, get().unreadCount - 1),
        })
        await notificationService.markAsRead(id)
      }
    } catch (err) {
      console.warn("Lỗi khi đánh dấu đã đọc:", err)
    }
  },

  async markAll() {
    try {
      set((state) => ({
        items: state.items.map((item) => ({ ...item, read: true, isRead: true })),
        unreadCount: 0,
      }))
      await notificationService.markAllAsRead()
    } catch (err) {
      console.warn("Lỗi khi đánh dấu tất cả đã đọc:", err)
    }
  },
}))
