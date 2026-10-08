import { client } from "../lib/axios/client"
import { API_PATHS } from "../lib/axios/api-paths"

export const criteriaGroups = [
  {
    title: "I. Ý thức tham gia học tập",
    max: 20,
    items: [
      ["study_attendance", "Đi học đầy đủ, đúng giờ", 8],
      ["study_results", "Nỗ lực trong học tập", 7],
      ["study_club", "Tham gia câu lạc bộ học thuật", 5],
    ],
  },
  {
    title: "II. Chấp hành nội quy, quy chế",
    max: 25,
    items: [
      ["rules_compliance", "Chấp hành quy chế đào tạo", 10],
      ["rules_campus", "Giữ gìn nếp sống văn minh", 8],
      ["rules_duty", "Thực hiện nghĩa vụ sinh viên", 7],
    ],
  },
  {
    title: "III. Hoạt động chính trị, xã hội",
    max: 20,
    items: [
      ["activity_union", "Tham gia hoạt động Đoàn - Hội", 8],
      ["proof_volunteer", "Hoạt động tình nguyện", 7],
      ["activity_sport", "Văn hóa, văn nghệ, thể thao", 5],
    ],
  },
  {
    title: "IV. Phẩm chất công dân và cộng đồng",
    max: 25,
    items: [
      ["citizen_ethics", "Có phẩm chất đạo đức tốt", 10],
      ["citizen_relation", "Quan hệ tốt với cộng đồng", 8],
      ["citizen_support", "Hỗ trợ bạn bè trong học tập", 7],
    ],
  },
  {
    title: "V. Công tác lớp, đoàn thể",
    max: 10,
    items: [
      ["class_duty", "Tham gia công tác lớp", 5],
      ["class_leadership", "Hoàn thành nhiệm vụ được giao", 5],
    ],
  },
]

export const submissionService = {
  async list(page = 1) {
    const servicePage = page - 1
    return (
      await client.get(API_PATHS.SUBMISSIONS, {
        mockData: { items: [], page: servicePage },
      })
    ).data
  },
  async save(payload) {
    return (
      await client.post(API_PATHS.SUBMISSIONS, payload, { mockData: payload })
    ).data
  },
}
