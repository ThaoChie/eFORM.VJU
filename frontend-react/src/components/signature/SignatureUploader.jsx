import { ImagePlus, RotateCw, ShieldCheck, Upload } from "lucide-react"
import { useRef, useState } from "react"
import { useSubmissionStore } from "../../stores/useSubmissionStore"
import StatusTag from "../ui/StatusTag"
import { Button, Card } from "../ui/Primitives"

export default function SignatureUploader({ level = 1 }) {
  const inputRef = useRef(null)
  const { hasSignature, registerSignature } = useSubmissionStore()
  const [preview, setPreview] = useState(null)
  const [error, setError] = useState("")
  const select = (file) => {
    if (!file) return
    if (file.name.toLowerCase().includes("trung"))
      return setError(
        "Ảnh chữ ký này đã được đăng ký bởi tài khoản khác. Vui lòng dùng chữ ký của chính bạn.",
      )
    if (
      !["image/png", "image/jpeg"].includes(file.type) ||
      file.size > 2 * 1024 * 1024
    )
      return setError("Chỉ nhận ảnh PNG hoặc JPG, tối đa 2 MB.")
    setError("")
    setPreview(URL.createObjectURL(file))
  }
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
      <Card>
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Đăng ký chữ ký</h2>
            <p className="mt-1 text-xs text-muted">
              PNG hoặc JPG, tối đa 2 MB, tối thiểu 300 × 100 px.
            </p>
          </div>
          {hasSignature ? (
            <span className="rounded-full bg-night px-3 py-1 text-xs text-white">
              Đã đăng ký
            </span>
          ) : (
            <span className="rounded-full border border-line px-3 py-1 text-xs text-muted">
              Chưa có chữ ký
            </span>
          )}
        </div>
        <button
          onClick={() => inputRef.current?.click()}
          className="flex min-h-48 w-full flex-col items-center justify-center rounded-lg border border-dashed border-disabled bg-canvas p-6 text-center hover:border-brand"
        >
          {preview ? (
            <img
              src={preview}
              alt="Xem trước chữ ký"
              className="max-h-24 max-w-[280px]"
            />
          ) : (
            <>
              <span className="flex size-12 items-center justify-center rounded-full bg-white">
                <Upload className="size-5 text-muted" />
              </span>
              <span className="mt-3 font-medium">
                Kéo ảnh chữ ký vào đây hoặc bấm để chọn
              </span>
              <span className="mt-1 text-xs text-muted">
                Nền trong suốt càng tốt
              </span>
            </>
          )}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".png,.jpg,.jpeg"
          className="hidden"
          onChange={(event) => select(event.target.files?.[0])}
        />
        {error && (
          <div className="mt-3 rounded-lg border border-brand-line bg-brand-soft p-3 text-sm text-brand">
            {error}
          </div>
        )}
        <div className="mt-4 flex items-center justify-between">
          <Button disabled={!preview}>
            <RotateCw className="size-4" />
            Xoay ảnh
          </Button>
          <Button
            variant="primary"
            disabled={!preview}
            onClick={registerSignature}
          >
            <ShieldCheck className="size-4" />
            Lưu chữ ký
          </Button>
        </div>
      </Card>
      <div className="space-y-4">
        <Card>
          <h3 className="font-semibold">Trạng thái</h3>
          <div className="mt-4 space-y-3 text-sm">
            <div>
              <span className="text-muted">Cấp ký</span>
              <p className="font-medium">
                {level === 3 ? "Trưởng khoa (cấp 3)" : "Sinh viên (cấp 1)"}
              </p>
            </div>
            {hasSignature && (
              <>
                <div>
                  <span className="text-muted">Mã vân tay</span>
                  <code className="mt-1 block font-semibold">SIG-3F9A21C4</code>
                  <p className="text-xs text-muted">
                    Mã đối chiếu, không dựng lại được ảnh
                  </p>
                </div>
                <div>
                  <span className="text-muted">Ngày đăng ký</span>
                  <p>05/10/2026</p>
                </div>
              </>
            )}
          </div>
        </Card>
        <Card className="bg-canvas">
          <h3 className="flex items-center gap-2 font-semibold">
            <ImagePlus className="size-4" />
            Ảnh chữ ký rõ hơn khi
          </h3>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li>• Ký bút đen trên giấy trắng</li>
            <li>• Chụp thẳng, đủ sáng</li>
            <li>• Cắt sát vùng chữ ký</li>
          </ul>
        </Card>
      </div>
    </div>
  )
}
