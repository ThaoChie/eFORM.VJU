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

  // Kích hoạt mở kỳ (Chưa mở -> Đang mở)
  async openPeriod(id) {
    const res = await client.post(`/admin/evaluation-periods/${id}/open`)
    return unwrap(res)
  },

  // Gia hạn hạn nộp kỳ chấm (U1, U2)
  async extendDeadline(id, newDeadline) {
    const res = await client.post(`/admin/evaluation-periods/${id}/extend`, { newDeadline })
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
