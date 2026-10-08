import { client } from "../lib/axios/client"
import { API_PATHS } from "../lib/axios/api-paths"

const seed = [
  "Kỳ chấm điểm rèn luyện đã mở",
  "Phiếu của bạn đã được lưu nháp",
  "Có 12 phiếu đang chờ lớp duyệt",
  "Lô BCSE2023 đã sẵn sàng ký",
  "Biểu mẫu v2.0 đang chờ phê duyệt",
]

export const notificationService = {
  async list() {
    return (
      await client.get(API_PATHS.NOTIFICATIONS, {
        mockData: seed.map((text, id) => ({
          id,
          text,
          read: id > 1,
          time: `${id + 1} giờ trước`,
        })),
      })
    ).data
  },
}
