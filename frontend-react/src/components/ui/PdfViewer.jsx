import {
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  Printer,
  ShieldCheck,
  Upload,
} from "lucide-react"
import { useMemo, useState, useRef } from "react"
import { toast } from "react-hot-toast"
import { IconButton } from "./Primitives"
import { rankScore } from "../../common/constants/index.js"

// Sinh ảnh chữ ký mực xanh uốn lượn sắc nét chuẩn phong cách ký tay chữ lồng dạng SVG
export function generateSignatureSvg(name = "Nguyễn Văn A") {
  const cleanName = (name || "Nguyễn Văn A").trim()
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 85" width="280" height="85">
    <path d="M 20,55 Q 50,15 90,58 T 160,40 Q 200,12 245,55" fill="none" stroke="#1d4ed8" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" opacity="0.85"/>
    <path d="M 35,68 Q 130,76 250,58" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round"/>
    <text x="50%" y="46" font-family="'Caveat', 'Dancing Script', 'Brush Script MT', cursive, sans-serif" font-size="34" font-weight="700" fill="#1e3a8a" text-anchor="middle" font-style="italic">
      ${cleanName}
    </text>
  </svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

export function normalizeSignatureImage(sig, fallbackName = "Nguyễn Văn A") {
  if (sig && typeof sig === "string") {
    const s = sig.trim()
    // Reject corrupted black-box artifact images or raw HEIC
    if (
      s.includes("iVBORw0KGgoAAAANSUhEUgAAAUAAAABkCAYAAAC3Yg8w") ||
      s.includes("AAAAJGZ0eX") ||
      s.includes("Z0eXBoZWlj")
    ) {
      return generateSignatureSvg(fallbackName)
    }
    if (
      s.startsWith("data:image/") ||
      s.startsWith("http://") ||
      s.startsWith("https://") ||
      s.startsWith("blob:")
    ) {
      return s
    }
    // If it's a raw base64 image string without header
    if (
      s.length > 50 &&
      !s.includes(" ") &&
      !s.includes("CONFIRMED") &&
      !s.includes("DIGITALLY")
    ) {
      return `data:image/png;base64,${s}`
    }
  }
  return generateSignatureSvg(fallbackName)
}

// Chuyển đổi số điểm thành chữ tiếng Việt chuẩn văn bản hành chính
function numberToVietnameseWords(num) {
  if (num == null || isNaN(num)) return "Không điểm"
  const n = Math.round(Number(num))
  if (n <= 0) return "Không điểm"
  if (n === 100) return "Một trăm điểm"

  const units = ["", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"]
  const tens = Math.floor(n / 10)
  const remainder = n % 10

  let str = ""
  if (tens === 1) {
    str = "Mười"
  } else if (tens > 1) {
    const tensWords = ["", "", "Hai mươi", "Ba mươi", "Bốn mươi", "Năm mươi", "Sáu mươi", "Bảy mươi", "Tám mươi", "Chín mươi"]
    str = tensWords[tens]
  }

  if (remainder > 0) {
    if (tens > 1 && remainder === 1) {
      str += " mốt"
    } else if (remainder === 5 && tens > 0) {
      str += " lăm"
    } else if (tens === 0) {
      str = units[remainder].charAt(0).toUpperCase() + units[remainder].slice(1)
    } else {
      str += " " + units[remainder]
    }
  }

  return str + " điểm"
}

// 5 NHÓM TIÊU CHÍ VÀ 17 TIÊU CHÍ CON THEO ĐÚNG NGUYÊN BẢN PHÔI BẰNG WORD (Phoi_Mau_Phieu_DRL_2026.docx)
const OFFICIAL_WORD_CRITERIA_STRUCTURE = [
  // --- TRANG 1: MỤC 1, 2, 3 ---
  {
    page: 1,
    tt: "1",
    title: "Ý thức và kết quả học tập, nghiên cứu khoa học",
    maxScore: "20đ",
    maxNum: 20,
    subItems: [
      {
        tt: "1.1",
        code: "score_1_1",
        title: "Ý thức và thái độ trong học tập",
        desc: "(Đi học đầy đủ, nghiêm túc trong giờ học, hoàn thành bài tập khi lên lớp)",
        maxScore: "3đ",
        maxNum: 3,
      },
      {
        tt: "1.2",
        code: "score_1_2",
        title: "Ý thức, thái độ tham gia các CLB học thuật, hoạt động học thuật, hoạt động ngoại khóa, giao lưu, hoạt động NCKH",
        desc: "(Tham gia tích cực một hoặc nhiều hoạt động giao lưu học thuật, NCKH, Ngoại ngữ)",
        maxScore: "3đ",
        maxNum: 3,
      },
      {
        tt: "1.3",
        code: "score_1_3",
        title: "Ý thức và thái độ tham gia các kỳ thi, cuộc thi",
        desc: "(Chấp hành tốt quy chế thi)",
        maxScore: "3đ",
        maxNum: 3,
      },
      {
        tt: "1.4",
        code: "score_1_4",
        title: "Tinh thần vượt khó, có nỗ lực phấn đấu vươn lên trong học tập",
        desc: "+ GPA duy trì ≥ 3,6 hoặc kết quả kỳ này cao hơn kỳ trước: 3đ\n+ GPA giảm trong khoảng 0,1đ – 0,3đ: 2đ\n+ GPA giảm trong khoảng 0,3đ – 0,5đ: 1đ",
        maxScore: "3đ",
        maxNum: 3,
      },
      {
        tt: "1.5",
        code: "score_1_5",
        title: "Kết quả học tập, nghiên cứu khoa học (Tối đa 8đ)",
        desc: "- Điểm kết quả học tập (GPA):\n  + Khá (2,5 ≤ GPA < 3,2): 2đ\n  + Giỏi (3,2 ≤ GPA < 3,6): 3đ\n  + Xuất sắc (GPA ≥ 3,6): 4đ\n- Đạt giải Nghiên cứu khoa học:\n  + Cấp Khoa: 2đ | Cấp Trường: 3đ | Cấp ĐHQGHN: 4đ",
        maxScore: "8đ",
        maxNum: 8,
      },
    ],
  },
  {
    page: 1,
    tt: "2",
    title: "Ý thức chấp hành các nội quy, quy chế, quy định của Trường và ĐHQGHN",
    maxScore: "25đ",
    maxNum: 25,
    subItems: [
      {
        tt: "2.1",
        code: "score_2_1",
        title: "Ý thức chấp hành các văn bản chỉ đạo của Đảng, Nhà nước, Bộ Giáo dục và Đào tạo và ĐHQGHN",
        desc: "",
        maxScore: "15đ",
        maxNum: 15,
      },
      {
        tt: "2.2",
        code: "score_2_2",
        title: "Ý thức chấp hành các nội quy, quy chế, quy định của Khoa, Trường và các đơn vị liên quan",
        desc: "- Vi phạm quy chế thi bị lập biên bản nhưng không bị đình chỉ thi: trừ 10đ\n- Vi phạm quy chế thi bị lập biên bản và bị đình chỉ thi: trừ 20đ\n- Kỷ luật mức Khiển trách: trừ 20đ | Cảnh cáo: trừ 25đ",
        maxScore: "10đ",
        maxNum: 10,
      },
    ],
  },
  {
    page: 1,
    tt: "3",
    title: "Ý thức tham gia các hoạt động chính trị - xã hội, văn hoá, văn nghệ, thể thao, phòng chống TNXH",
    maxScore: "20đ",
    maxNum: 20,
    subItems: [
      {
        tt: "3.1",
        code: "score_3_1",
        title: "Ý thức và hiệu quả tham gia các hoạt động rèn luyện về chính trị, xã hội, văn hóa, nghệ thuật, thể thao",
        desc: "- Không tham gia Tuần Sinh hoạt công dân sinh viên: trừ 10đ\n- Không tham gia hoạt động khác do Trường tổ chức/yêu cầu: vắng 1 lần trừ 5đ, từ 2 lần trở lên trừ 10đ",
        maxScore: "10đ",
        maxNum: 10,
      },
      {
        tt: "3.2",
        code: "score_3_2",
        title: "Tham gia các hoạt động công ích, tình nguyện, công tác xã hội, hỗ trợ tổ chức sự kiện của Nhà trường",
        desc: "(Có minh chứng kèm theo: danh sách tham dự, giấy chứng nhận, giấy khen...)",
        maxScore: "5đ",
        maxNum: 5,
      },
      {
        tt: "3.3",
        code: "score_3_3",
        title: "Ý thức tham gia tuyên truyền, phòng chống tội phạm và các tệ nạn xã hội",
        desc: "",
        maxScore: "5đ",
        maxNum: 5,
      },
    ],
  },

  // --- TRANG 2: MỤC 4, 5, TỔNG ĐIỂM, GHI CHÚ, KẾT LUẬN & CHỮ KÝ ---
  {
    page: 2,
    tt: "4",
    title: "Ý thức công dân và quan hệ với cộng đồng",
    maxScore: "25đ",
    maxNum: 25,
    subItems: [
      {
        tt: "4.1",
        code: "score_4_1",
        title: "Ý thức chấp hành và tham gia tuyên truyền các chủ trương của Đảng, chính sách, pháp luật của Nhà nước trong cộng đồng",
        desc: "",
        maxScore: "10đ",
        maxNum: 10,
      },
      {
        tt: "4.2",
        code: "score_4_2",
        title: "Ý thức tham gia các hoạt động xã hội có thành tích được ghi nhận, biểu dương, khen thưởng. Tham gia hoạt động tình nguyện của Đoàn TN (Mùa đông ấm, Mùa hè xanh, Hiến máu...)",
        desc: "+ Tham gia tình nguyện trực tiếp: 10đ\n+ Chuẩn bị cho các chiến dịch nhưng không tham dự: 5đ\n(Có minh chứng kèm theo: giấy chứng nhận, giấy khen...)",
        maxScore: "10đ",
        maxNum: 10,
      },
      {
        tt: "4.3",
        code: "score_4_3",
        title: "Có tinh thần chia sẻ, giúp đỡ bạn bè, người thân, người gặp khó khăn, hoạn nạn",
        desc: "",
        maxScore: "5đ",
        maxNum: 5,
      },
    ],
  },
  {
    page: 2,
    tt: "5",
    title: "Ý thức và kết quả tham gia công tác lớp, đoàn thể, thành tích đặc biệt",
    maxScore: "10đ",
    maxNum: 10,
    subItems: [
      {
        tt: "5.1",
        code: "score_5_1",
        title: "Ý thức, tinh thần, thái độ, uy tín và hiệu quả công việc của sinh viên khi được phân công nhiệm vụ quản lý lớp, tổ chức Đảng, Đoàn TN, Hội SV, CLB",
        desc: "+ Chủ nhiệm, Bí thư, BĐH, BĐP, Ban Chấp hành: 3đ\n+ Phó Chủ nhiệm, Phó Bí thư, Lớp phó: 2đ\n+ Trưởng ban các CLB: 1đ",
        maxScore: "3đ",
        maxNum: 3,
      },
      {
        tt: "5.2",
        code: "score_5_2",
        title: "Kỹ năng tổ chức, quản lý lớp, quản lý các tổ chức Đảng, Đoàn TN, Hội SV, CLB",
        desc: "+ Chủ nhiệm, Bí thư, BĐH, BĐP, Ban Chấp hành: 2đ\n+ Phó Chủ nhiệm, Phó Bí thư, Lớp phó: 2đ\n+ Trưởng ban: 1đ",
        maxScore: "2đ",
        maxNum: 2,
      },
      {
        tt: "5.3",
        code: "score_5_3",
        title: "Hỗ trợ và tham gia tích cực vào các hoạt động chung của lớp, tập thể, khoa và đơn vị đào tạo",
        desc: "",
        maxScore: "2đ",
        maxNum: 2,
      },
      {
        tt: "5.4",
        code: "score_5_4",
        title: "Thành tích đặc biệt trong học tập, rèn luyện góp phần nâng cao, quảng bá hình ảnh ĐHQGHN",
        desc: "(Có minh chứng kèm theo: giấy chứng nhận, giấy khen...)",
        maxScore: "3đ",
        maxNum: 3,
      },
    ],
  },
]

export default function PdfViewer({
  score = 0,
  studentTotal = null,
  classTotal = null,
  finalTotal = null,
  official = false,
  user = null,
  semesterName = "Học kỳ 1",
  academicYear = "2026 - 2027",
  details = null,
  scores = {},
  classScores = {},
  studentSignature = null,
  classSignature = null,
  deanSignature = null,
  classLeaderName = null,
  deanName = null,
}) {
  const [zoom, setZoom] = useState(85)
  // Page mode: 1 (Trang 1), 2 (Trang 2), "ALL" (Hiển thị cả 2 trang A4)
  const [pageView, setPageView] = useState("ALL")

  // Map of scores by criteriaCode
  const scoreMap = useMemo(() => {
    const map = {}
    if (details && Array.isArray(details)) {
      details.forEach((d) => {
        const code = d.criteriaCode || String(d.criteriaId)
        map[code] = {
          studentScore: d.studentScore != null ? Number(d.studentScore) : 0,
          classScore: d.classScore != null ? Number(d.classScore) : null,
        }
      })
    }
    return map
  }, [details])

  // Lấy điểm theo code
  const getScoresForCode = (code) => {
    const fromMap = scoreMap[code] || {}

    let st = 0
    if (fromMap.studentScore != null) {
      st = fromMap.studentScore
    } else if (scores[code] != null && scores[code] !== "") {
      st = Number(scores[code])
    }

    let cl = null
    if (fromMap.classScore != null) {
      cl = fromMap.classScore
    } else if (classScores[code] != null && classScores[code] !== "") {
      cl = Number(classScores[code])
    } else if (classScores && Object.keys(classScores).length > 0) {
      cl = st
    }

    return { st, cl }
  }

  // Tính tổng điểm từng nhóm và tổng toàn phiếu
  const { renderedSections, grandTotalSv, grandTotalLop } = useMemo(() => {
    let sumSv = 0
    let sumLop = 0

    const sections = OFFICIAL_WORD_CRITERIA_STRUCTURE.map((sec) => {
      let secSv = 0
      let secLop = 0

      const mappedSubs = sec.subItems.map((sub) => {
        const { st, cl } = getScoresForCode(sub.code)
        secSv += st
        if (cl != null) secLop += cl
        return {
          ...sub,
          st,
          cl,
        }
      })

      const clampedSecSv = Math.min(sec.maxNum, secSv)
      const clampedSecLop = Math.min(sec.maxNum, secLop)

      sumSv += clampedSecSv
      sumLop += clampedSecLop

      return {
        ...sec,
        secTotalSv: clampedSecSv,
        secTotalLop: clampedSecLop,
        mappedSubs,
      }
    })

    return {
      renderedSections: sections,
      grandTotalSv: Math.min(100, sumSv),
      grandTotalLop: Math.min(100, sumLop),
    }
  }, [scores, classScores, scoreMap])

  // Sections for Page 1 and Page 2
  const page1Sections = useMemo(
    () => renderedSections.filter((s) => s.page === 1),
    [renderedSections]
  )
  const page2Sections = useMemo(
    () => renderedSections.filter((s) => s.page === 2),
    [renderedSections]
  )

  // Tổng điểm chính thức và xếp loại
  const finalSvTotal = studentTotal != null ? Number(studentTotal) : grandTotalSv
  const finalLopTotal = classTotal != null ? Number(classTotal) : (classScores && Object.keys(classScores).length > 0 ? grandTotalLop : finalSvTotal)
  const finalScore = finalTotal != null ? Number(finalTotal) : finalLopTotal
  const finalScoreText = numberToVietnameseWords(finalScore)
  const finalRanking = rankScore(finalScore)

  // Trạng thái và ref để sinh viên / người dùng tải ảnh chữ ký trực tiếp lên phiếu
  const studentFileInputRef = useRef(null)
  const [uploadedStudentSig, setUploadedStudentSig] = useState(null)

  const handleStudentSigUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!["image/png", "image/jpeg", "image/jpg", "image/webp"].includes(file.type)) {
      toast.error("Chỉ chấp nhận file ảnh PNG, JPG hoặc WEBP.")
      return
    }
    if (file.size > 3 * 1024 * 1024) {
      toast.error("Dung lượng ảnh tối đa 3 MB.")
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      setUploadedStudentSig(result)
      const uId = user?.id || 4
      try {
        localStorage.setItem(`user_signature_${uId}`, result)
      } catch (err) {
        console.warn("Storage warning:", err)
      }
      toast.success("Đã chèn ảnh chữ ký thành công!")
    }
    reader.readAsDataURL(file)
  }

  // Trạng thái và ref để cán bộ lớp tải ảnh chữ ký trực tiếp lên phiếu
  const classFileInputRef = useRef(null)
  const [uploadedClassSig, setUploadedClassSig] = useState(null)

  const handleClassSigUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!["image/png", "image/jpeg", "image/jpg", "image/webp"].includes(file.type)) {
      toast.error("Chỉ chấp nhận file ảnh PNG, JPG hoặc WEBP.")
      return
    }
    if (file.size > 3 * 1024 * 1024) {
      toast.error("Dung lượng ảnh tối đa 3 MB.")
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      setUploadedClassSig(result)
      try {
        localStorage.setItem("user_signature_3", result)
        const storedUser = JSON.parse(localStorage.getItem("user") || "{}")
        if (storedUser?.id) {
          localStorage.setItem(`user_signature_${storedUser.id}`, result)
        }
      } catch (err) {
        console.warn("Storage warning:", err)
      }
      toast.success("Đã tải và áp dụng ảnh chữ ký Cán bộ lớp thành công!")
    }
    reader.readAsDataURL(file)
  }

  // Trạng thái và ref để GVCN / Khoa tải ảnh chữ ký trực tiếp lên phiếu
  const deanFileInputRef = useRef(null)
  const [uploadedDeanSig, setUploadedDeanSig] = useState(null)

  const handleDeanSigUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!["image/png", "image/jpeg", "image/jpg", "image/webp"].includes(file.type)) {
      toast.error("Chỉ chấp nhận file ảnh PNG, JPG hoặc WEBP.")
      return
    }
    if (file.size > 3 * 1024 * 1024) {
      toast.error("Dung lượng ảnh tối đa 3 MB.")
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      setUploadedDeanSig(result)
      try {
        localStorage.setItem("user_signature_2", result)
        const storedUser = JSON.parse(localStorage.getItem("user") || "{}")
        if (storedUser?.id) {
          localStorage.setItem(`user_signature_${storedUser.id}`, result)
        }
      } catch (err) {
        console.warn("Storage warning:", err)
      }
      toast.success("Đã tải và áp dụng ảnh chữ ký GVCN / Khoa thành công!")
    }
    reader.readAsDataURL(file)
  }

  // Robust student signature resolution (strictly scoped to student)
  const effectiveStudentSig = useMemo(() => {
    if (uploadedStudentSig) return uploadedStudentSig
    if (studentSignature) return studentSignature
    if (user?.signatureSpecimenUrl) return user.signatureSpecimenUrl
    const uId = user?.id || user?.studentId
    if (uId) {
      try {
        return localStorage.getItem(`user_signature_${uId}`) || null
      } catch {
        return null
      }
    }
    return null
  }, [uploadedStudentSig, studentSignature, user])

  // Luôn đảm bảo sinh viên có ảnh chữ ký hiển thị trên bản in/xem trước
  const studentSigImage = useMemo(() => {
    if (uploadedStudentSig) return uploadedStudentSig
    if (effectiveStudentSig) {
      return normalizeSignatureImage(effectiveStudentSig, user?.fullName || "Nguyễn Văn A")
    }
    return generateSignatureSvg(user?.fullName || "Nguyễn Văn A")
  }, [uploadedStudentSig, effectiveStudentSig, user?.fullName])

  // Class leader signature resolution: priority to uploaded image, then explicit prop
  const effectiveClassSig = useMemo(() => {
    if (uploadedClassSig) return uploadedClassSig
    if (classSignature && typeof classSignature === "string" && classSignature.trim() !== "") {
      return classSignature
    }
    return null
  }, [uploadedClassSig, classSignature])

  const classSigImage = useMemo(() => {
    if (uploadedClassSig) return uploadedClassSig
    if (effectiveClassSig) {
      return normalizeSignatureImage(effectiveClassSig, classLeaderName || "Lớp trưởng")
    }
    return null
  }, [uploadedClassSig, effectiveClassSig, classLeaderName])

  // Dean signature resolution: priority to uploaded image, then explicit prop
  const effectiveDeanSig = useMemo(() => {
    if (uploadedDeanSig) return uploadedDeanSig
    if (deanSignature && typeof deanSignature === "string" && deanSignature.trim() !== "") {
      return deanSignature
    }
    return null
  }, [uploadedDeanSig, deanSignature])

  const deanSigImage = useMemo(() => {
    if (uploadedDeanSig) return uploadedDeanSig
    if (effectiveDeanSig) {
      return normalizeSignatureImage(effectiveDeanSig, deanName || "Trưởng Khoa CNTT")
    }
    return null
  }, [uploadedDeanSig, effectiveDeanSig, deanName])

  // Chuẩn hóa tên học kỳ: loại bỏ phần năm học bị trùng lặp (ví dụ "Học kỳ 2 Năm 2026-2027" -> "Học kỳ 2")
  const displaySemester = useMemo(() => {
    if (!semesterName) return "Học kỳ 1"
    let clean = semesterName
      .replace(/năm\s*học\s*[\d\s\-_/]+/gi, "")
      .replace(/năm\s*[\d\s\-_/]+/gi, "")
      .replace(/\([\d\s\-_/]+\)/g, "")
      .replace(/[-–—]\s*[\d\s\-_/]+/g, "")
      .replace(/,\s*$/, "")
      .trim()
    return clean || semesterName
  }, [semesterName])

  const displayAcademicYear = useMemo(() => {
    if (academicYear && academicYear.trim() !== "") return academicYear.trim()
    const match = (semesterName || "").match(/20\d{2}\s*[-–—/]\s*20\d{2}/)
    if (match) return match[0].replace(/\s*[-–—/]\s*/, " - ")
    return "2026 - 2027"
  }, [academicYear, semesterName])

  // Current date
  const now = new Date()
  const signDay = String(now.getDate()).padStart(2, "0")
  const signMonth = String(now.getMonth() + 1).padStart(2, "0")
  const signYear = String(now.getFullYear())

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-slate-300 bg-slate-100 shadow-sm">
      {/* Hidden file input for uploading student signature image */}
      <input
        type="file"
        ref={studentFileInputRef}
        accept="image/png,image/jpeg,image/jpg,image/webp"
        className="hidden"
        onChange={handleStudentSigUpload}
      />
      {/* Hidden file input for uploading class leader signature image */}
      <input
        type="file"
        ref={classFileInputRef}
        accept="image/png,image/jpeg,image/jpg,image/webp"
        className="hidden"
        onChange={handleClassSigUpload}
      />
      {/* Hidden file input for uploading dean signature image */}
      <input
        type="file"
        ref={deanFileInputRef}
        accept="image/png,image/jpeg,image/jpg,image/webp"
        className="hidden"
        onChange={handleDeanSigUpload}
      />

      {/* TOOLBAR */}
      <div className="flex h-12 flex-wrap items-center justify-between border-b border-slate-200 bg-white px-3 text-xs gap-2">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-800">Phôi biểu mẫu ĐRL (Chuẩn Word 2026)</span>
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
            {official ? "Bản chính thức" : "Bản xem trước"}
          </span>
        </div>

        {/* PHÂN TRANG VÀ CHỌN TRANG */}
        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
          <button
            type="button"
            onClick={() => setPageView(1)}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition ${
              pageView === 1 ? "bg-white text-brand shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Trang 1
          </button>
          <button
            type="button"
            onClick={() => setPageView(2)}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition ${
              pageView === 2 ? "bg-white text-brand shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Trang 2 (Có chữ ký)
          </button>
          <button
            type="button"
            onClick={() => setPageView("ALL")}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition ${
              pageView === "ALL" ? "bg-white text-brand shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Tất cả 2 trang
          </button>
        </div>

        {/* ZOOM VÀ NÚT TẢI CHỮ KÝ */}
        <div className="flex items-center gap-1.5">
          <IconButton
            label="Thu nhỏ"
            onClick={() => setZoom(Math.max(50, zoom - 10))}
          >
            <Minus className="size-3.5" />
          </IconButton>
          <span className="w-10 text-center font-mono font-medium text-slate-600">
            {zoom}%
          </span>
          <IconButton
            label="Phóng to"
            onClick={() => setZoom(Math.min(120, zoom + 10))}
          >
            <Plus className="size-3.5" />
          </IconButton>
          <div className="mx-1 h-4 w-px bg-slate-200" />
          <IconButton label="In phiếu" onClick={handlePrint}>
            <Printer className="size-3.5" />
          </IconButton>
        </div>
      </div>

      {/* PAPER CANVAS CONTAINER */}
      <div className="flex flex-col items-center overflow-auto p-4 sm:p-6 bg-slate-300/60 max-h-[750px] space-y-6">
        {/* ===================== TRANG 1 ===================== */}
        {(pageView === 1 || pageView === "ALL") && (
          <div
            className="pdf-times-roman relative origin-top bg-white text-black shadow-2xl border border-slate-300 p-8 sm:p-12 transition-transform text-[13px] leading-normal"
            style={{
              fontFamily: '"Times New Roman", Times, "Liberation Serif", serif',
              width: "800px",
              minHeight: "1130px",
              transform: `scale(${zoom / 100})`,
              marginBottom: pageView === "ALL" ? `${((zoom - 100) / 100) * 1130}px` : "0px",
            }}
          >
            {!official && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center select-none opacity-5">
                <span className="text-6xl font-black uppercase rotate-[-30deg] tracking-widest text-slate-900">
                  BẢN XEM TRƯỚC ĐRL
                </span>
              </div>
            )}

            {/* TABLE 1: QUỐC HIỆU / TIÊU NGỮ / TÊN TRƯỜNG */}
            <table className="w-full border-collapse mb-4 text-center">
              <tbody>
                <tr>
                  <td className="w-1/2 align-top text-center pb-2">
                    <p className="text-[12.5px] uppercase font-normal leading-tight">
                      ĐẠI HỌC QUỐC GIA HÀ NỘI
                    </p>
                    <p className="text-[13px] font-bold uppercase leading-tight mt-1">
                      TRƯỜNG ĐẠI HỌC VIỆT NHẬT
                    </p>
                    <div className="mx-auto mt-1 h-[1px] w-28 bg-black" />
                  </td>
                  <td className="w-1/2 align-top text-center pb-2">
                    <p className="text-[13px] font-bold uppercase leading-tight">
                      CỘNG HOÀ XÃ HỘI CHỦ NGHĨA VIỆT NAM
                    </p>
                    <p className="text-[13px] font-bold leading-tight mt-1">
                      Độc lập - Tự do - Hạnh phúc
                    </p>
                    <div className="mx-auto mt-1 h-[1px] w-36 bg-black" />
                  </td>
                </tr>
              </tbody>
            </table>

            {/* TIÊU ĐỀ CHÍNH VĂN BẢN */}
            <div className="text-center my-4">
              <h1 className="text-[15px] font-bold uppercase tracking-wide">
                PHIẾU ĐÁNH GIÁ KẾT QUẢ RÈN LUYỆN CỦA SINH VIÊN
              </h1>
              <p className="text-[13px] italic mt-1">
                Học kỳ: <span className="font-bold not-italic">{displaySemester}</span> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Năm học: <span className="font-bold not-italic">{displayAcademicYear}</span>
              </p>
            </div>

            {/* THÔNG TIN SINH VIÊN */}
            <div className="my-3 space-y-1.5 text-[13px] leading-relaxed">
              <div className="flex flex-wrap justify-between">
                <span>Họ và tên: <b className="uppercase">{user?.fullName || "Nguyễn Văn A"}</b></span>
                <span>Ngày sinh: <b>{user?.dob || "15/09/2004"}</b></span>
                <span>Mã SV: <b>{user?.userCode || user?.studentCode || "SV2026001"}</b></span>
              </div>
              <div className="flex flex-wrap justify-between">
                <span>Lớp: <b>{user?.className || "IT01"}</b></span>
                <span>Ngành: <b>{user?.majorName || "Công nghệ Thông tin"}</b></span>
                <span>Khóa: <b>{user?.academicCohort || "2023 - 2027"}</b></span>
                <span>Khoa: <b>{user?.facultyName || user?.departmentName || "Khoa Công nghệ Thông tin"}</b></span>
              </div>
            </div>

            {/* BẢNG TIÊU CHÍ TRANG 1: MỤC 1, 2, 3 */}
            <table className="w-full border-collapse border border-black text-[12.5px] my-3 leading-snug">
              <thead>
                <tr className="text-center font-bold bg-slate-50">
                  <th className="border border-black p-1.5 w-10">TT</th>
                  <th className="border border-black p-1.5 text-center">Nội dung đánh giá</th>
                  <th className="border border-black p-1.5 w-16 text-center">Điểm tối đa</th>
                  <th className="border border-black p-1.5 w-20 text-center">SV tự đánh giá</th>
                  <th className="border border-black p-1.5 w-20 text-center">Lớp đánh giá</th>
                </tr>
              </thead>
              <tbody>
                {page1Sections.map((sec) => (
                  <SectionRows key={sec.tt} section={sec} />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ===================== TRANG 2 ===================== */}
        {(pageView === 2 || pageView === "ALL") && (
          <div
            className="pdf-times-roman relative origin-top bg-white text-black shadow-2xl border border-slate-300 p-8 sm:px-12 sm:py-7 transition-transform text-[13px] leading-normal"
            style={{
              fontFamily: '"Times New Roman", Times, "Liberation Serif", serif',
              width: "800px",
              minHeight: "1130px",
              transform: `scale(${zoom / 100})`,
              marginBottom: `${((zoom - 100) / 100) * 1130}px`,
            }}
          >
            {!official && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center select-none opacity-5">
                <span className="text-6xl font-black uppercase rotate-[-30deg] tracking-widest text-slate-900">
                  BẢN XEM TRƯỚC ĐRL
                </span>
              </div>
            )}

            {/* BẢNG TIÊU CHÍ TRANG 2: MỤC 4, 5 VÀ TỔNG ĐIỂM */}
            <table className="w-full border-collapse border border-black text-[12px] my-2 leading-snug">
              <thead>
                <tr className="text-center font-bold bg-slate-50">
                  <th className="border border-black py-1 px-1.5 w-10">TT</th>
                  <th className="border border-black py-1 px-1.5 text-center">Nội dung đánh giá (tiếp theo)</th>
                  <th className="border border-black py-1 px-1.5 w-16 text-center">Điểm tối đa</th>
                  <th className="border border-black py-1 px-1.5 w-20 text-center">SV tự đánh giá</th>
                  <th className="border border-black py-1 px-1.5 w-20 text-center">Lớp đánh giá</th>
                </tr>
              </thead>
              <tbody>
                {page2Sections.map((sec) => (
                  <SectionRows key={sec.tt} section={sec} />
                ))}

                {/* HÀNG TỔNG ĐIỂM */}
                <tr className="font-bold text-[12.5px] text-black">
                  <td colSpan={2} className="border border-black py-1 px-1.5 text-center font-bold text-black">
                    Tổng
                  </td>
                  <td className="border border-black py-1 px-1.5 text-center font-bold text-black">
                    100đ
                  </td>
                  <td className="border border-black py-1 px-1.5 text-center font-bold text-black">
                    {finalSvTotal}đ
                  </td>
                  <td className="border border-black py-1 px-1.5 text-center font-bold text-black">
                    {finalLopTotal != null ? `${finalLopTotal}đ` : "—"}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* GHI CHÚ CHUẨN PHÔI */}
            <div className="mt-1.5 mb-1.5 text-[12px] italic leading-snug text-black">
              <p>
                <u><b className="font-bold not-italic">Ghi chú:</b></u> - Điểm rèn luyện là tổng của 5 mục đánh giá trên và điểm thưởng (nếu vượt quá 100 thì làm tròn bằng 100).
              </p>
              <p className="pl-5 mt-0.5">
                - Sinh viên bị kỷ luật mức khiển trách thuộc nội dung nào thì điểm rèn luyện ở nội dung đó không được tính.
              </p>
              <p className="pl-5 mt-0.5">
                - Sinh viên bị kỷ luật mức cảnh cáo toàn trường ở học kỳ nào thì học kỳ đó được xếp loại rèn luyện không quá Trung bình.
              </p>
            </div>

            {/* VÙNG CHỮ KÝ SINH VIÊN (CĂN BÊN PHẢI THEO PHÔI GỐC) */}
            <div className="flex justify-end mt-1 mb-2 pr-4 text-black">
              <div className="w-56 text-center text-[13px] text-black">
                <div className="font-bold uppercase tracking-wide text-black">SINH VIÊN</div>
                <div className="text-[12px] italic text-black">(Ký và ghi rõ họ tên)</div>
                <div
                  className="h-16 flex items-center justify-center my-0.5"
                >
                  {studentSigImage ? (
                    <div className="flex flex-col items-center">
                      <img
                        src={studentSigImage}
                        alt="Chữ ký Sinh viên"
                        className="mx-auto max-h-12 max-w-[150px] object-contain drop-shadow-xs"
                        style={{ mixBlendMode: "multiply" }}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = generateSignatureSvg(user?.fullName || "Nguyễn Văn A");
                        }}
                      />
                    </div>
                  ) : (
                    <span className="text-black/60 italic text-xs">— (Chưa ký) —</span>
                  )}
                </div>
                <div className="font-bold text-[13px] mt-0.5 text-black">{user?.fullName || "Nguyễn Văn A"}</div>
              </div>
            </div>

            {/* KẾT LUẬN ĐÁNH GIÁ CỦA LỚP */}
            <div className="my-2 text-[13px] text-black leading-relaxed">
              <p className="font-bold uppercase text-center text-[13.5px] mb-1 tracking-wide text-black">
                KẾT LUẬN ĐÁNH GIÁ CỦA LỚP
              </p>
              <div className="flex items-baseline text-black">
                <span className="font-bold whitespace-nowrap text-black">Điểm rèn luyện:</span>
                <span className="font-bold text-black px-1">
                  {finalLopTotal != null ? `${finalLopTotal}đ` : ".................."}
                </span>
                <span className="flex-1 border-b border-dotted border-black mx-1 mb-1" />
                <span className="font-bold whitespace-nowrap ml-2 text-black">Ghi bằng chữ:</span>
                <span className="italic font-medium text-black px-1">
                  {finalScoreText || "...................................................."}
                </span>
                <span className="flex-1 border-b border-dotted border-black mx-1 mb-1" />
              </div>
              <div className="flex items-baseline mt-1 text-black">
                <span className="font-bold whitespace-nowrap text-black">Xếp loại rèn luyện:</span>
                <span className="font-bold text-black uppercase px-2">
                  {finalRanking || "................................................................................................................"}
                </span>
                <span className="flex-1 border-b border-dotted border-black mx-1 mb-1" />
              </div>
            </div>

            {/* KHỐI KÝ CÁN BỘ LỚP VÀ GIÁO VIÊN CHỦ NHIỆM */}
            <div className="mt-2 text-black">
              <table className="w-full border-collapse text-center text-[13px] text-black">
                <tbody>
                  {/* DÒNG NGÀY THÁNG CĂN TRÊN CỘT GVCN */}
                  <tr className="text-black">
                    <td className="w-1/2" />
                    <td className="w-1/2 text-center pb-0.5 italic text-[12px] text-black">
                      Hà Nội, ngày {signDay} tháng {signMonth} năm 20{signYear.slice(-2)}
                    </td>
                  </tr>

                  {/* TIÊU ĐỀ 2 CỘT */}
                  <tr className="font-bold uppercase align-top text-[13px] text-black">
                    <td className="w-1/2 pb-0.5 text-black">
                      CÁN BỘ LỚP
                      <div className="text-[12px] italic font-normal capitalize text-black">(Ký và ghi rõ họ tên)</div>
                    </td>
                    <td className="w-1/2 pb-0.5 text-black">
                      GIÁO VIÊN CHỦ NHIỆM
                      <div className="text-[12px] italic font-normal capitalize text-black">(Ký và ghi rõ họ tên)</div>
                    </td>
                  </tr>

                  {/* NÉT CHỮ KÝ */}
                  <tr className="h-16 align-middle text-black">
                    {/* Ô KÝ CÁN BỘ LỚP */}
                    <td
                      className="p-1 align-middle text-black"
                    >
                      {classSigImage ? (
                        <div className="flex flex-col items-center justify-center">
                          <img
                            src={classSigImage}
                            alt="Chữ ký Cán bộ lớp"
                            className="mx-auto max-h-12 max-w-[150px] object-contain drop-shadow-xs"
                            style={{ mixBlendMode: "multiply" }}
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = generateSignatureSvg(classLeaderName || "Nguyễn Văn B");
                            }}
                          />
                        </div>
                      ) : (
                        <span className="text-black/60 italic text-xs">— (Chờ duyệt) —</span>
                      )}
                    </td>

                    {/* Ô KÝ GIÁO VIÊN CHỦ NHIỆM */}
                    <td
                      className="p-1 align-middle text-black"
                    >
                      {deanSigImage ? (
                        <div className="flex flex-col items-center justify-center">
                          <img
                            src={deanSigImage}
                            alt="Chữ ký Giáo viên chủ nhiệm"
                            className="mx-auto max-h-12 max-w-[150px] object-contain drop-shadow-xs"
                            style={{ mixBlendMode: "multiply" }}
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = generateSignatureSvg(deanName || "Trưởng Khoa CNTT");
                            }}
                          />
                        </div>
                      ) : (
                        <span className="text-black/60 italic text-xs">— (Chờ duyệt) —</span>
                      )}
                    </td>
                  </tr>

                  {/* DÒNG HỌ VÀ TÊN DƯỚI CHỮ KÝ */}
                  <tr className="font-bold text-[13px] align-bottom text-black">
                    <td className="pt-0.5 text-black">{classLeaderName || ""}</td>
                    <td className="pt-0.5 text-black">{deanName || ""}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Subcomponent: Dòng nhóm và các dòng tiêu chí con theo phôi Word
function SectionRows({ section }) {
  return (
    <>
      {/* DÒNG TIÊU ĐỀ NHÓM (IN ĐẬM) */}
      <tr className="font-bold bg-slate-100/70 text-black">
        <td className="border border-black py-1 px-1.5 text-center font-bold text-black">
          {section.tt}
        </td>
        <td className="border border-black py-1 px-1.5 font-bold text-black">
          {section.title}
        </td>
        <td className="border border-black py-1 px-1.5 text-center font-bold text-black">
          {section.maxScore}
        </td>
        <td className="border border-black py-1 px-1.5 text-center font-bold text-black">
          {section.secTotalSv}đ
        </td>
        <td className="border border-black py-1 px-1.5 text-center font-bold text-black">
          {section.secTotalLop}đ
        </td>
      </tr>

      {/* CÁC TIÊU CHÍ CON CHI TIẾT */}
      {section.mappedSubs.map((sub) => (
        <tr key={sub.tt} className="align-top text-black">
          <td className="border border-black py-1 px-1.5 text-center font-bold text-black">
            {sub.tt}
          </td>
          <td className="border border-black py-1 px-1.5 text-black">
            <p className="font-medium text-black">{sub.title}</p>
            {sub.desc && (
              <p className="text-[11.5px] italic text-black whitespace-pre-line mt-0.5">
                {sub.desc}
              </p>
            )}
          </td>
          <td className="border border-black py-1 px-1.5 text-center font-medium text-black">
            {sub.maxScore}
          </td>
          <td className="border border-black py-1 px-1.5 text-center font-semibold text-black">
            {sub.st}đ
          </td>
          <td className="border border-black py-1 px-1.5 text-center font-bold text-black">
            {sub.cl != null ? `${sub.cl}đ` : `${sub.st}đ`}
          </td>
        </tr>
      ))}
    </>
  )
}
