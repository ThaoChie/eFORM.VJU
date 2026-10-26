import {
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  Download,
  Minus,
  Plus,
} from "lucide-react"
import { useState } from "react"
import { Button, IconButton, Modal } from "./Primitives"
import { OFFICIAL_DRL_2026_BLOCKS } from "../../services/submission-service"

export default function PdfViewer({
  score = 0,
  total = null,
  official = false,
  user = null,
  semesterName = "Học kỳ 1, năm học 2026-2027",
  groups = OFFICIAL_DRL_2026_BLOCKS,
  scores = {},
}) {
  const [zoom, setZoom] = useState(75)
  const [verify, setVerify] = useState(false)

  const finalTotal = total != null ? total : score

  // Calculate scores per group
  const groupScores = (groups || OFFICIAL_DRL_2026_BLOCKS).map((g) => {
    let sum = 0
    if (g.children) {
      g.children.forEach((c) => {
        sum += Number(scores[c.fieldCode] || 0)
      })
    }
    const max = Number(g.maxScore || 20)
    return {
      title: g.title,
      max,
      score: Math.min(sum, max),
    }
  })

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-canvas">
      <div className="flex h-12 items-center gap-1 border-b border-line bg-white px-3">
        <span className="mr-auto rounded-full bg-canvas px-2.5 py-1 text-xs font-medium">
          {official ? "Bản chính thức - đã khóa" : "Bản xem trước"}
        </span>
        <IconButton
          label="Thu nhỏ"
          onClick={() => setZoom(Math.max(50, zoom - 10))}
        >
          <Minus className="size-4" />
        </IconButton>
        <span className="w-12 text-center text-xs text-muted">{zoom}%</span>
        <IconButton
          label="Phóng to"
          onClick={() => setZoom(Math.min(110, zoom + 10))}
        >
          <Plus className="size-4" />
        </IconButton>
        <IconButton label="Trang trước">
          <ChevronLeft className="size-4" />
        </IconButton>
        <span className="text-xs">1 / 1</span>
        <IconButton label="Trang sau">
          <ChevronRight className="size-4" />
        </IconButton>
        {official && (
          <IconButton label="Tải PDF">
            <Download className="size-4" />
          </IconButton>
        )}
      </div>
      <div className="relative flex min-h-[560px] justify-center overflow-auto p-5">
        <div
          className="relative min-h-[520px] w-[400px] origin-top border border-line bg-white p-7 text-[8.5px] shadow-sm leading-relaxed"
          style={{
            transform: `scale(${zoom / 75})`,
            marginBottom: `${(zoom / 75 - 1) * 520}px`,
          }}
        >
          {!official && (
            <div className="watermark pointer-events-none absolute inset-0 flex items-center justify-center text-center text-base font-semibold text-line/60 rotate-[-25deg]">
              BẢN XEM TRƯỚC - PHIẾU ĐRL 2026
            </div>
          )}
          <div className="text-center">
            <div className="font-semibold text-slate-600 uppercase text-[7.5px] tracking-wider">
              ĐẠI HỌC QUỐC GIA HÀ NỘI
            </div>
            <div className="font-bold text-slate-900 uppercase text-[9px]">
              TRƯỜNG ĐẠI HỌC VIỆT NHẬT
            </div>
            <div className="mt-3 text-xs font-bold text-slate-900 uppercase">
              PHIẾU ĐÁNH GIÁ KẾT QUẢ RÈN LUYỆN
            </div>
            <div className="text-slate-600 italic text-[8px]">{semesterName}</div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-1.5 border-y border-slate-700 py-2.5 text-[8px]">
            <div>
              <span className="text-slate-500">Họ tên:</span>{" "}
              <strong className="text-slate-900">{user?.fullName || "Nguyễn Văn A"}</strong>
            </div>
            <div>
              <span className="text-slate-500">Mã SV:</span>{" "}
              <strong className="text-slate-900">{user?.userID || user?.userCode || "—"}</strong>
            </div>
            <div>
              <span className="text-slate-500">Lớp:</span>{" "}
              <strong className="text-slate-900">{user?.className || "—"}</strong>
            </div>
            <div>
              <span className="text-slate-500">Khoa / CTĐT:</span>{" "}
              <strong className="text-slate-900">{user?.facultyName || "Viện / Khoa"}</strong>
            </div>
          </div>

          <table className="mt-3 w-full border-collapse border border-slate-700 text-[8px]">
            <thead>
              <tr className="bg-slate-100">
                <th className="border border-slate-700 p-1.5 text-left font-semibold">
                  Nội dung đánh giá rèn luyện
                </th>
                <th className="border border-slate-700 p-1.5 text-center font-semibold w-12">
                  Tối đa
                </th>
                <th className="border border-slate-700 p-1.5 text-center font-semibold w-12">
                  Tự chấm
                </th>
              </tr>
            </thead>
            <tbody>
              {groupScores.map((g, i) => (
                <tr key={g.title}>
                  <td className="border border-slate-700 p-1.5">
                    {g.title}
                  </td>
                  <td className="border border-slate-700 p-1.5 text-center">
                    {g.max}
                  </td>
                  <td className="border border-slate-700 p-1.5 text-center font-medium">
                    {g.score}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-2.5 flex justify-between items-center bg-slate-50 border border-slate-700 p-2 font-bold text-[8.5px]">
            <span>TỔNG ĐIỂM ĐÁNH GIÁ (MAX: 100)</span>
            <span className="text-base font-extrabold text-brand-dark">
              {finalTotal} / 100
            </span>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-2 text-center text-[7.5px]">
            {["Sinh viên tự chấm", "Tập thể lớp đánh giá", "Khoa / Trường duyệt"].map((slot, index) => (
              <div key={slot} className="min-h-20 border border-line p-1.5 flex flex-col justify-between">
                <div className="font-semibold text-slate-800">{slot}</div>
                <div className="signature-stroke my-1 text-sm text-slate-900">
                  {official || index === 0 ? (user?.fullName || "Sinh viên") : "—"}
                </div>
                <div className="text-[7px] text-muted italic">
                  {index === 0 ? "(Ký và ghi rõ họ tên)" : "(Ký duyệt)"}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {official && (
        <div className="border-t border-line bg-white p-3">
          <Button className="w-full" onClick={() => setVerify(true)}>
            <BadgeCheck className="size-4" />
            Thông tin chứng thực
          </Button>
        </div>
      )}

      <Modal
        open={verify}
        title="Thông tin chứng thực"
        onClose={() => setVerify(false)}
        footer={
          <Button variant="primary" onClick={() => setVerify(false)}>
            Đóng
          </Button>
        }
      >
        <div className="space-y-4 text-sm">
          <div className="rounded-lg bg-canvas p-4 font-semibold">
            Đã khóa chứng nhận (DocMDP mức 1)
          </div>
          <div>
            <div className="text-xs text-muted">Người ký</div>
            <div className="mt-2 space-y-2">
              <p>Sinh viên — {user?.fullName || "Sinh viên"} · Đã xác thực chữ ký</p>
            </div>
          </div>
          <div>
            <div className="text-xs text-muted">Mã băm SHA-256</div>
            <code className="mt-1 block break-all rounded-lg bg-canvas p-3 text-xs">
              3f9a21c45eb18a42f0d728ab1253ef9d4c783fb00f132a9b5e809b1c30295d17
            </code>
          </div>
          <Button>Kiểm tra toàn vẹn</Button>
        </div>
      </Modal>
    </div>
  )
}
