export const Role = {
  STUDENT: "student",
  CLASS_LEADER: "class-leader",
  CLASS_DEPUTY: "class-deputy",
  DEAN: "dean",
  ADMIN: "admin",
}

export const SubmissionStatus = {
  DRAFT: "Soạn thảo",
  RETURNED: "Đã chuyển trả",
  CLASS_PENDING: "Chờ lớp duyệt",
  DEAN_PENDING: "Chờ khoa duyệt",
  DONE: "Hoàn tất",
}

export const PAGE_SIZE = 10

export const rankScore = (score) =>
  score >= 90
    ? "Xuất sắc"
    : score >= 80
      ? "Tốt"
      : score >= 65
        ? "Khá"
        : score >= 50
          ? "Trung bình"
          : score >= 35
            ? "Yếu"
            : "Kém"

export const formatDate = (value) =>
  new Intl.DateTimeFormat("vi-VN").format(new Date(value))

export const sleep = (ms = 300) =>
  new Promise((resolve) => setTimeout(resolve, ms))
