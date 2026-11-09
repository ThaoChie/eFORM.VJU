import { client } from "../lib/axios/client"

export const batchService = {
  // Lấy danh sách lô theo lớp thực tế cho Trưởng khoa
  async list() {
    try {
      const res = await client.get("/workflow/dean/batches")
      if (Array.isArray(res) && res.length > 0) {
        return res
      }
    } catch (e) {
      console.warn("Backend /workflow/dean/batches endpoint error, calculating from classes & pending-queue:", e)
    }

    // Fallback tính toán trực tiếp từ /classes và /workflow/pending-queue
    try {
      const [clsRes, queueRes] = await Promise.allSettled([
        client.get("/classes"),
        client.get("/workflow/pending-queue", { params: { page: 0, size: 200 } }),
      ])

      const classes = (clsRes.status === "fulfilled" && clsRes.value) ? (Array.isArray(clsRes.value) ? clsRes.value : clsRes.value.content || []) : []
      const pendingForms = (queueRes.status === "fulfilled" && queueRes.value) ? (Array.isArray(queueRes.value) ? queueRes.value : queueRes.value.content || []) : []

      if (classes.length > 0) {
        return classes.map((c) => {
          const classPendingForms = pendingForms.filter(
            (f) => String(f.raw?.student?.classEntity?.id) === String(c.id) ||
                   String(f.className) === String(c.className) ||
                   f.className === c.classCode
          )
          const pendingCount = classPendingForms.length

          return {
            id: c.id,
            classCode: c.classCode,
            className: c.className,
            size: c.studentCount || 0,
            pending: pendingCount,
            done: 0,
            reviewer: c.leaders?.[0]?.fullName || "Cán bộ lớp",
            status: pendingCount > 0 ? "Chờ khoa duyệt" : "Chưa có phiếu duyệt",
          }
        })
      }
    } catch (err) {
      console.error("Lỗi khi nạp danh sách lô:", err)
    }

    return []
  },
}

export const service = batchService
