import { create } from "zustand"
import { notificationService } from "../services/notification-service"

export const useNotificationStore = create((set) => ({
  items: [],
  async load() {
    set({ items: await notificationService.list() })
  },
  markAll: () =>
    set((state) => ({
      items: state.items.map((item) => ({ ...item, read: true })),
    })),
  markOne: (id) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id ? { ...item, read: true } : item,
      ),
    })),
  push: () =>
    set((state) => ({
      items: [
        {
          id: Date.now(),
          text: "Bạn có một cập nhật mới cần xem",
          read: false,
          time: "Vừa xong",
        },
        ...state.items,
      ].slice(0, 10),
    })),
}))
