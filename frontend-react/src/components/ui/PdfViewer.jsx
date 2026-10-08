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

export default function PdfViewer({ score = 82, official = false }) {
  const [zoom, setZoom] = useState(75)
  const [verify, setVerify] = useState(false)
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
          className="relative min-h-[520px] w-[390px] origin-top border border-line bg-white p-8 text-[8px] shadow-sm"
          style={{
            transform: `scale(${zoom / 75})`,
            marginBottom: `${(zoom / 75 - 1) * 520}px`,
          }}
        >
          {!official && (
            <div className="watermark pointer-events-none absolute inset-0 flex items-center justify-center text-lg font-semibold text-line">
              BẢN XEM TRƯỚC - CHƯA CÓ GIÁ TRỊ
            </div>
          )}
          <div className="text-center">
            <div className="font-bold">TRƯỜNG ĐẠI HỌC CÔNG NGHỆ</div>
            <div className="mt-4 text-sm font-bold">
              PHIẾU ĐÁNH GIÁ KẾT QUẢ RÈN LUYỆN
            </div>
            <div>Học kỳ 1, năm học 2026-2027</div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-2 border-y border-night py-3">
            <span>Họ tên: Nguyễn Văn An</span>
            <span>Mã SV: 23110101</span>
            <span>Lớp: BCSE2023</span>
            <span>Khoa: Công nghệ thông tin</span>
          </div>
          <table className="mt-4 w-full border-collapse">
            <thead>
              <tr>
                <th className="border border-night p-2 text-left">
                  Nội dung đánh giá
                </th>
                <th className="border border-night p-2">Tối đa</th>
                <th className="border border-night p-2">Điểm</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Ý thức tham gia học tập", 20],
                ["Chấp hành nội quy, quy chế", 25],
                ["Hoạt động chính trị, xã hội", 20],
                ["Phẩm chất công dân", 25],
                ["Công tác lớp, đoàn thể", 10],
              ].map(([label, max], i) => (
                <tr key={label}>
                  <td className="border border-night p-2">
                    {i + 1}. {label}
                  </td>
                  <td className="border border-night p-2 text-center">{max}</td>
                  <td className="border border-night p-2 text-center">
                    {Math.round(score * [0.2, 0.25, 0.2, 0.25, 0.1][i])}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-3 text-right text-xs font-bold">
            Tổng điểm: {score} / 100
          </div>
          <div className="mt-10 grid grid-cols-3 gap-3 text-center">
            {["Sinh viên", "Lớp", "Khoa"].map((slot, index) => (
              <div key={slot} className="h-20 border border-line p-2">
                <div className="font-semibold">{slot}</div>
                {official && (
                  <div className="signature-stroke mt-2 text-base">
                    {["Văn An", "Minh Đức", "Quốc Bảo"][index]}
                  </div>
                )}
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
              <p>Sinh viên — Nguyễn Văn An · 05/10/2026 08:31</p>
              <p>Lớp trưởng — Phạm Minh Đức · 05/10/2026 09:12</p>
              <p>Trưởng khoa — TS. Trần Quốc Bảo · 05/10/2026 10:24</p>
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
