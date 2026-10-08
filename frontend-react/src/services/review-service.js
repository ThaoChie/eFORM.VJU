import { client } from "../lib/axios/client"
import { API_PATHS } from "../lib/axios/api-paths"

const names = [
  "Trần Minh Anh",
  "Lê Hoàng Nam",
  "Ngô Thùy Dương",
  "Đỗ Gia Bảo",
  "Phan Hải Yến",
  "Trương Quốc Việt",
  "Bùi Khánh Linh",
  "Hoàng Đức Long",
  "Đặng Thu Trang",
  "Võ Minh Quân",
  "Lý Bảo Ngọc",
  "Hà Nhật Minh",
]

export const reviewService = {
  async list() {
    const items = names.map((name, index) => ({
      id: String(index + 1),
      name,
      code: `23110${120 + index}`,
      submitted: `${8 + index}/10/2026`,
      score: 72 + (index % 18),
      draft: index === 2,
      conflict: index === 5,
    }))
    return (await client.get(API_PATHS.REVIEWS, { mockData: items })).data
  },
}
