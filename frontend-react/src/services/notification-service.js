import { client } from "../lib/axios/client"
import { API_PATHS } from "../lib/axios/api-paths"

export const notificationService = {
  // Lấy danh sách thông báo phân trang + số lượng chưa đọc từ API
  async list(page = 0, size = 20) {
    const res = await client.get(API_PATHS.NOTIFICATIONS, {
      params: { page, size },
    })
    return res || { data: [], total: 0, unreadCount: 0 }
  },

  // Đánh dấu một thông báo đã đọc
  async markAsRead(id) {
    return await client.patch(`${API_PATHS.NOTIFICATIONS}/${id}/read`)
  },

  // Đánh dấu tất cả thông báo là đã đọc
  async markAllAsRead() {
    return await client.patch(`${API_PATHS.NOTIFICATIONS}/read-all`)
  },
}
