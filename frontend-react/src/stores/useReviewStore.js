import { create } from "zustand"
import { reviewService } from "../services/review-service"

export const useReviewStore = create((set, get) => ({
  items: [],
  loading: false,
  error: null,
  async load() {
    set({ loading: true, error: null })
    try {
      const items = await reviewService.list()
      set({ items, loading: false })
    } catch (err) {
      console.error("Lỗi khi tải danh sách phiếu chờ duyệt:", err)
      set({ items: [], loading: false, error: err.message || "Lỗi tải dữ liệu" })
    }
  },
  approve: (id) =>
    set((state) => ({
      items: state.items.filter((item) => String(item.id) !== String(id)),
    })),
  removeForm: (id) =>
    set((state) => ({
      items: state.items.filter((item) => String(item.id) !== String(id)),
    })),
}))
