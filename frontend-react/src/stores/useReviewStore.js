import { create } from "zustand"
import { reviewService } from "../services/review-service"

export const useReviewStore = create((set) => ({
  items: [],
  loading: false,
  async load() {
    set({ loading: true })
    set({ items: await reviewService.list(), loading: false })
  },
  approve: (id) =>
    set((state) => ({ items: state.items.filter((item) => item.id !== id) })),
}))
