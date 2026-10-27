import { client } from "../lib/axios/client"

export const reviewService = {
  // Lấy danh sách phiếu chờ duyệt của lớp hoặc khoa
  async list(page = 0, size = 50) {
    const res = await client.get("/workflow/pending-queue", {
      params: { page, size },
    })

    const rawList = res?.content || (Array.isArray(res) ? res : [])
    return rawList.map((item, index) => ({
      id: String(item.id),
      key: String(item.id || index),
      name: item.studentName || "Sinh viên",
      code: item.studentCode || `SV${item.id}`,
      className: item.className || "",
      submitted: item.submittedAt
        ? new Date(item.submittedAt).toLocaleDateString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })
        : "—",
      score: item.studentTotal != null ? Number(item.studentTotal) : 0,
      classScore: item.classTotal != null ? Number(item.classTotal) : null,
      status: item.status || "SUBMITTED",
      draft: item.status === "DRAFT",
      raw: item,
    }))
  },

  // Lấy chi tiết phiếu duyệt từ API
  async getDetail(id) {
    const res = await client.get(`/workflow/forms/${id}`)
    return res
  },

  // Duyệt cấp lớp kèm chữ ký điện tử
  async classApprove(id, payload) {
    return await client.post(`/workflow/${id}/class/approve`, payload)
  },

  // Trả lại phiếu
  async reject(id, reason) {
    return await client.post(`/workflow/${id}/reject`, {
      rejectReason: reason,
      reason: reason,
    })
  },
}
