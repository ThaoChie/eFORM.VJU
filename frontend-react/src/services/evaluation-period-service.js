import { client } from "../lib/axios/client"

const unwrap = (res) => {
  if (res && typeof res === "object" && "data" in res && !Array.isArray(res)) {
    return res.data
  }
  return res
}

export const evaluationPeriodService = {
  // Lấy danh sách kỳ chấm ĐRL (kèm tìm kiếm & lọc)
  async searchPeriods(params = {}) {
    const res = await client.get("/admin/evaluation-periods", { params })
    return unwrap(res) || []
  },

  // Lấy chi tiết kỳ chấm ĐRL và lịch sử thay đổi (Audit Log)
  async getPeriodById(id) {
    const res = await client.get(`/admin/evaluation-periods/${id}`)
    return unwrap(res)
  },

  // Lấy các options phục vụ form mở kỳ (Học kỳ, Phiên bản biểu mẫu, Phạm vi)
  async getFormOptions() {
    const res = await client.get("/admin/evaluation-periods/form-options")
    return unwrap(res) || { semesters: [], formVersions: [], scopes: [] }
  },

  // Mở kỳ chấm ĐRL mới (C)
  async createPeriod(payload) {
    const res = await client.post("/admin/evaluation-periods", payload)
    return unwrap(res)
  },

  // Cập nhật thông tin kỳ chấm ĐRL (khi ở trạng thái Chưa mở)
  async updatePeriod(id, payload) {
    const res = await client.put(`/admin/evaluation-periods/${id}`, payload)
    return unwrap(res)
  },

  // Vô hiệu hóa kỳ chấm ĐRL (thay thế xóa cứng)
  async deactivatePeriod(id) {
    const res = await client.post(`/admin/evaluation-periods/${id}/deactivate`)
    return unwrap(res)
  },

  // Kích hoạt / Kích hoạt lại kỳ chấm ĐRL
  async activatePeriod(id) {
    const res = await client.post(`/admin/evaluation-periods/${id}/activate`)
    return unwrap(res)
  },

  // Soft delete fallback nếu còn gọi deletePeriod
  async deletePeriod(id) {
    return this.deactivatePeriod(id)
  },

  // Kích hoạt mở kỳ (Chưa mở -> Đang mở)
  async openPeriod(id) {
    const res = await client.post(`/admin/evaluation-periods/${id}/open`)
    return unwrap(res)
  },

  // Gia hạn hạn nộp hoặc cấu hình ngoại lệ mở lẻ (Luồng 1a)
  async extendDeadline(id, payload) {
    const body = typeof payload === "string" ? { newDeadline: payload, extendScope: "ALL" } : payload
    const res = await client.post(`/admin/evaluation-periods/${id}/extend`, body)
    return unwrap(res)
  },

  // Đóng kỳ sớm (U3, U4)
  async closePeriod(id) {
    const res = await client.post(`/admin/evaluation-periods/${id}/close`)
    return unwrap(res)
  },

  // Lấy kỳ đánh giá đang mở (dành cho sinh viên/dashboard)
  async getActivePeriod() {
    const res = await client.get("/evaluation-periods/active")
    return unwrap(res)
  },
}
