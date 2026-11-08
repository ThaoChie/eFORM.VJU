import { client } from "../lib/axios/client"
import { API_PATHS } from "../lib/axios/api-paths"

// 5 NHÓM TIÊU CHÍ CHUẨN (100Đ) THEO BIỂU MẪU DRL-2026 VERSION 1.0 (VJU)
export const OFFICIAL_DRL_2026_BLOCKS = [
  {
    id: "group_1",
    type: "CRITERIA_GROUP",
    fieldCode: "total_section_1",
    title: "1. Ý thức và kết quả học tập, nghiên cứu khoa học",
    description: "Đánh giá ý thức thái độ trên lớp, tham gia NCKH, thi học thuật, vượt khó và kết quả GPA.",
    maxScore: 20,
    calculationMode: "CLAMPED_SUM",
    children: [
      {
        id: "crit_1_1",
        type: "CRITERIA",
        fieldCode: "score_1_1",
        title: "1.1. Ý thức và thái độ trong học tập",
        description: "Đi học đầy đủ, nghiêm túc trong giờ học, hoàn thành bài tập khi lên lớp.",
        maxScore: 3,
        isRequired: true,
        requiresProof: false,
      },
      {
        id: "crit_1_2",
        type: "CRITERIA",
        fieldCode: "score_1_2",
        title: "1.2. Ý thức, thái độ tham gia các CLB học thuật, hoạt động ngoại khóa, giao lưu, NCKH",
        description: "Tham gia tích cực một hoặc nhiều hoạt động giao lưu học thuật, NCKH, Ngoại ngữ.",
        maxScore: 3,
        isRequired: false,
        requiresProof: true,
      },
      {
        id: "crit_1_3",
        type: "CRITERIA",
        fieldCode: "score_1_3",
        title: "1.3. Ý thức và thái độ tham gia các kỳ thi, cuộc thi",
        description: "Chấp hành tốt quy chế thi và các quy định phòng thi.",
        maxScore: 3,
        isRequired: true,
        requiresProof: false,
      },
      {
        id: "crit_1_4",
        type: "CRITERIA",
        fieldCode: "score_1_4",
        title: "1.4. Tinh thần vượt khó, có nỗ lực phấn đấu vươn lên trong học tập",
        description: "+ GPA duy trì ≥ 3.6 hoặc kết quả kỳ này cao hơn kỳ trước: 3đ\n+ GPA giảm trong khoảng 0.1đ – 0.3đ: 2đ\n+ GPA giảm trong khoảng 0.3đ – 0.5đ: 1đ",
        maxScore: 3,
        isRequired: false,
        requiresProof: false,
      },
      {
        id: "crit_1_5",
        type: "CRITERIA",
        fieldCode: "score_1_5",
        title: "1.5. Kết quả học tập, nghiên cứu khoa học (Tối đa 8đ)",
        description: "- Điểm kết quả học tập (GPA):\n  + Khá (2.5 ≤ GPA < 3.2): 2đ\n  + Giỏi (3.2 ≤ GPA < 3.6): 3đ\n  + Xuất sắc (GPA ≥ 3.6): 4đ\n- Đạt giải Nghiên cứu khoa học:\n  + Cấp Khoa: 2đ | Cấp Trường: 3đ | Cấp ĐHQGHN: 4đ",
        maxScore: 8,
        isRequired: true,
        requiresProof: true,
      },
    ],
  },
  {
    id: "group_2",
    type: "CRITERIA_GROUP",
    fieldCode: "total_section_2",
    title: "2. Ý thức chấp hành các nội quy, quy chế, quy định của Trường và ĐHQGHN",
    description: "Chấp hành chủ trương của Đảng, Nhà nước và nội quy, quy chế thi cử, kỷ luật của Trường.",
    maxScore: 25,
    calculationMode: "CLAMPED_SUM",
    children: [
      {
        id: "crit_2_1",
        type: "CRITERIA",
        fieldCode: "score_2_1",
        title: "2.1. Ý thức chấp hành các văn bản chỉ đạo của Đảng, Nhà nước, Bộ GD&ĐT và ĐHQGHN",
        description: "Nghiêm chỉnh chấp hành pháp luật, các chủ trương chính sách và quy định chung.",
        maxScore: 15,
        isRequired: true,
        requiresProof: false,
      },
      {
        id: "crit_2_2",
        type: "CRITERIA",
        fieldCode: "score_2_2",
        title: "2.2. Ý thức chấp hành các nội quy, quy chế, quy định của Khoa, Trường và đơn vị",
        description: "- Vi phạm quy chế thi bị lập biên bản nhưng không bị đình chỉ thi: trừ 10đ\n- Vi phạm quy chế thi bị lập biên bản và bị đình chỉ thi: trừ 20đ\n- Kỷ luật mức Khiển trách: trừ 20đ | Cảnh cáo: trừ 25đ",
        maxScore: 10,
        isRequired: true,
        requiresProof: false,
      },
    ],
  },
  {
    id: "group_3",
    type: "CRITERIA_GROUP",
    fieldCode: "total_section_3",
    title: "3. Ý thức tham gia các hoạt động chính trị - xã hội, văn hoá, thể thao, phòng chống TNXH",
    description: "Tham gia tuần sinh hoạt công dân, hoạt động rèn luyện chính trị xã hội, tình nguyện công ích.",
    maxScore: 20,
    calculationMode: "CLAMPED_SUM",
    children: [
      {
        id: "crit_3_1",
        type: "CRITERIA",
        fieldCode: "score_3_1",
        title: "3.1. Ý thức và hiệu quả tham gia hoạt động chính trị, xã hội, văn hóa, thể thao",
        description: "- Không tham gia Tuần Sinh hoạt công dân sinh viên: trừ 10đ\n- Không tham gia hoạt động khác do Trường tổ chức/yêu cầu: vắng 1 lần trừ 5đ, từ 2 lần trở lên trừ 10đ",
        maxScore: 10,
        isRequired: true,
        requiresProof: false,
      },
      {
        id: "crit_3_2",
        type: "CRITERIA",
        fieldCode: "score_3_2",
        title: "3.2. Tham gia các hoạt động công ích, tình nguyện, công tác xã hội, hỗ trợ sự kiện",
        description: "Có minh chứng kèm theo: danh sách tham dự, giấy chứng nhận, giấy khen...",
        maxScore: 5,
        isRequired: false,
        requiresProof: true,
      },
      {
        id: "crit_3_3",
        type: "CRITERIA",
        fieldCode: "score_3_3",
        title: "3.3. Ý thức tham gia tuyên truyền, phòng chống tội phạm và các tệ nạn xã hội",
        description: "Tích cực tham gia giữ gìn an ninh trật tự, phòng chống tệ nạn học đường và xã hội.",
        maxScore: 5,
        isRequired: true,
        requiresProof: false,
      },
    ],
  },
  {
    id: "group_4",
    type: "CRITERIA_GROUP",
    fieldCode: "total_section_4",
    title: "4. Ý thức công dân và quan hệ với cộng đồng",
    description: "Tuyên truyền chủ trương pháp luật, hoạt động tình nguyện Đoàn TN, tinh thần tương thân tương ái.",
    maxScore: 25,
    calculationMode: "CLAMPED_SUM",
    children: [
      {
        id: "crit_4_1",
        type: "CRITERIA",
        fieldCode: "score_4_1",
        title: "4.1. Ý thức chấp hành và tuyên truyền chủ trương của Đảng, chính sách pháp luật trong cộng đồng",
        description: "Gương mẫu chấp hành pháp luật tại nơi cư trú và cộng đồng xã hội.",
        maxScore: 10,
        isRequired: true,
        requiresProof: false,
      },
      {
        id: "crit_4_2",
        type: "CRITERIA",
        fieldCode: "score_4_2",
        title: "4.2. Ý thức tham gia hoạt động xã hội có thành tích, hoạt động tình nguyện Đoàn TN",
        description: "Mùa đông ấm, Mùa hè xanh, Hiến máu nhân đạo...\n+ Tham gia tình nguyện trực tiếp: 10đ\n+ Chuẩn bị cho các chiến dịch nhưng không tham dự: 5đ\n(Có minh chứng kèm theo: giấy chứng nhận, giấy khen...)",
        maxScore: 10,
        isRequired: false,
        requiresProof: true,
      },
      {
        id: "crit_4_3",
        type: "CRITERIA",
        fieldCode: "score_4_3",
        title: "4.3. Tinh thần chia sẻ, giúp đỡ bạn bè, người thân, người gặp khó khăn hoạn nạn",
        description: "Có hành động giúp đỡ bạn bè vượt khó, tham gia quyên góp ủng hộ cộng đồng.",
        maxScore: 5,
        isRequired: false,
        requiresProof: false,
      },
    ],
  },
  {
    id: "group_5",
    type: "CRITERIA_GROUP",
    fieldCode: "total_section_5",
    title: "5. Ý thức và kết quả tham gia công tác lớp, đoàn thể, thành tích đặc biệt",
    description: "Đảm nhận nhiệm vụ cán bộ lớp, Đoàn - Hội, kỹ năng tổ chức và thành tích đặc biệt cho ĐHQGHN.",
    maxScore: 10,
    calculationMode: "CLAMPED_SUM",
    children: [
      {
        id: "crit_5_1",
        type: "CRITERIA",
        fieldCode: "score_5_1",
        title: "5.1. Ý thức, tinh thần, uy tín và hiệu quả công việc khi được phân công quản lý lớp, đoàn thể",
        description: "+ Chủ nhiệm, Bí thư, BĐH, BĐP, Ban Chấp hành: 3đ\n+ Phó Chủ nhiệm, Phó Bí thư, Lớp phó: 2đ\n+ Trưởng ban các CLB: 1đ",
        maxScore: 3,
        isRequired: false,
        requiresProof: false,
      },
      {
        id: "crit_5_2",
        type: "CRITERIA",
        fieldCode: "score_5_2",
        title: "5.2. Kỹ năng tổ chức, quản lý lớp, quản lý các tổ chức Đảng, Đoàn TN, Hội SV, CLB",
        description: "+ Chủ nhiệm, Bí thư, BĐH, BĐP, Ban Chấp hành: 2đ\n+ Phó Chủ nhiệm, Phó Bí thư, Lớp phó: 2đ\n+ Trưởng ban: 1đ",
        maxScore: 2,
        isRequired: false,
        requiresProof: false,
      },
      {
        id: "crit_5_3",
        type: "CRITERIA",
        fieldCode: "score_5_3",
        title: "5.3. Hỗ trợ và tham gia tích cực vào các hoạt động chung của lớp, khoa và đơn vị",
        description: "Nhiệt tình tham gia chuẩn bị, điều phối các buổi sinh hoạt lớp và sự kiện.",
        maxScore: 2,
        isRequired: true,
        requiresProof: false,
      },
      {
        id: "crit_5_4",
        type: "CRITERIA",
        fieldCode: "score_5_4",
        title: "5.4. Thành tích đặc biệt trong học tập, rèn luyện góp phần quảng bá hình ảnh ĐHQGHN",
        description: "Có giải thưởng văn thể mỹ, học thuật cấp Quốc gia/Quốc tế hoặc khen thưởng đặc biệt (Có minh chứng kèm theo).",
        maxScore: 3,
        isRequired: false,
        requiresProof: true,
      },
    ],
  },
]

// Adapter tương thích với các view hiển thị criteriaGroups cũ
export const criteriaGroups = OFFICIAL_DRL_2026_BLOCKS.map((g) => ({
  title: g.title,
  max: g.maxScore,
  items: g.children.map((c) => [c.fieldCode, c.title, c.maxScore, c.requiresProof, c.description]),
}))

const unwrap = (res) => {
  if (res && typeof res === "object" && "data" in res && !Array.isArray(res)) {
    return res.data
  }
  return res
}

export const submissionService = {
  // Lấy kỳ đánh giá đang mở (active evaluation period)
  async getActivePeriod() {
    const res = await client.get("/evaluation-periods/active")
    return unwrap(res)
  },

  // Lấy danh sách học kỳ
  async getAllSemesters() {
    const res = await client.get("/semesters")
    return unwrap(res)
  },

  // Lấy học kỳ đang mở (active)
  async getActiveSemester() {
    try {
      const activePeriod = await this.getActivePeriod()
      if (activePeriod && activePeriod.semesterId) {
        return {
          id: activePeriod.semesterId,
          semesterName: activePeriod.semesterName,
          academicYear: activePeriod.academicYear,
          isActive: true,
          deadline: activePeriod.submissionDeadline,
          remainingDays: activePeriod.remainingDays,
          formVersionId: activePeriod.formVersionId,
          formName: activePeriod.formName,
          formCode: activePeriod.formCode,
        }
      }
    } catch (e) {
      console.warn("Could not fetch active evaluation period, checking semesters...", e)
    }

    const list = await this.getAllSemesters()
    if (!Array.isArray(list) || list.length === 0) return null
    return list.find((s) => s.isActive === true) || null
  },

  // Lấy danh sách lịch sử phiếu của sinh viên
  async getHistory() {
    const res = await client.get("/editor/history")
    return unwrap(res)
  },

  // Lấy phiếu của sinh viên theo ID phiếu
  async getMyFormById(formId) {
    const res = await client.get(`/editor/form/${formId}`)
    return unwrap(res)
  },

  // Lấy phiếu của sinh viên theo học kỳ (nếu chưa có, backend tự sinh theo FormVersion DRL-2026 active)
  async getMyForm(semesterId) {
    const res = await client.get("/editor/my-form", { params: { semesterId } })
    return unwrap(res)
  },

  // Lưu nháp điểm và minh chứng
  async saveDraft(payload) {
    const res = await client.post("/editor/save-draft", payload)
    return unwrap(res)
  },

  // Upload file minh chứng lên S3/MinIO
  async uploadProof(semesterId, file) {
    const formData = new FormData()
    formData.append("file", file)
    const res = await client.post("/editor/upload-proof", formData, {
      params: { semesterId },
      headers: { "Content-Type": "multipart/form-data" },
    })
    return unwrap(res)
  },

  // Đẩy duyệt kèm chữ ký điện tử
  async submitAndSign(payload) {
    const res = await client.post("/editor/submit-and-sign", payload)
    return unwrap(res)
  },

  // Hủy bản nháp
  async cancelDraft(semesterId) {
    const res = await client.delete("/editor/cancel-draft", { params: { semesterId } })
    return unwrap(res)
  },

  // Các phương thức legacy hỗ trợ list/save
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
