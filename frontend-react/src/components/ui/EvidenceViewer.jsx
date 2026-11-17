import { useState, useMemo, useEffect } from "react"
import {
  FileText,
  FileSpreadsheet,
  FileCode,
  Image as ImageIcon,
  Download,
  ExternalLink,
  AlertCircle,
  RefreshCw,
  File,
  Eye,
  CheckCircle2,
  X,
} from "lucide-react"
import { Button, Modal } from "./Primitives"
import { getProofUrl } from "../../lib/axios/client"

/**
 * Download a file cleanly across Data URLs, Blob URLs, and Remote CORS URLs
 */
export async function downloadProofFile(url, fileName = "tai_lieu_minh_chung") {
  if (!url) return

  const cleanName = fileName || "tai_lieu_minh_chung"

  // Data URL or Blob URL
  if (url.startsWith("data:") || url.startsWith("blob:")) {
    const a = document.createElement("a")
    a.href = url
    a.download = cleanName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    return
  }

  // Remote URL: fetch as blob to enforce browser Save-As dialog
  try {
    const safeUrl = getProofUrl(url)
    const response = await fetch(safeUrl, { method: "GET", mode: "cors" })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const blob = await response.blob()
    const blobUrl = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = blobUrl
    a.download = cleanName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(blobUrl), 2000)
  } catch (err) {
    // Fallback: direct anchor trigger
    const a = document.createElement("a")
    a.href = getProofUrl(url)
    a.download = cleanName
    a.target = "_blank"
    a.rel = "noopener noreferrer"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }
}

/**
 * Determine category of proof
 */
export function getProofCategory(file = {}) {
  const name = String(file.name || "").toLowerCase()
  const type = String(file.type || "").toLowerCase()
  const url = String(file.url || "").toLowerCase()

  if (
    name.endsWith(".png") ||
    name.endsWith(".jpg") ||
    name.endsWith(".jpeg") ||
    name.endsWith(".webp") ||
    name.endsWith(".gif") ||
    name.endsWith(".svg") ||
    name.endsWith(".bmp") ||
    type.startsWith("image/") ||
    url.startsWith("data:image/")
  ) {
    return "IMAGE"
  }

  if (
    name.endsWith(".pdf") ||
    type === "application/pdf" ||
    url.startsWith("data:application/pdf")
  ) {
    return "PDF"
  }

  if (
    name.endsWith(".xlsx") ||
    name.endsWith(".xls") ||
    name.endsWith(".csv") ||
    type.includes("sheet") ||
    type.includes("excel") ||
    type.includes("csv")
  ) {
    return "EXCEL"
  }

  if (
    name.endsWith(".docx") ||
    name.endsWith(".doc") ||
    type.includes("word") ||
    type.includes("document")
  ) {
    return "WORD"
  }

  if (
    name.endsWith(".pptx") ||
    name.endsWith(".ppt") ||
    type.includes("presentation") ||
    type.includes("powerpoint")
  ) {
    return "POWERPOINT"
  }

  return "OTHER"
}

/**
 * Proof Preview Lightbox Component
 */
export default function EvidenceViewer({ proof, onClose }) {
  const [imgError, setImgError] = useState(false)
  const [blobSrc, setBlobSrc] = useState(null)
  const [downloading, setDownloading] = useState(false)

  // Reset error state when proof changes
  useEffect(() => {
    setImgError(false)
    setBlobSrc(null)
  }, [proof?.url, proof?.name, proof?.dataUrl])

  if (!proof) return null

  const category = getProofCategory(proof)
  const safeUrl = proof.url ? getProofUrl(proof.url) : (proof.dataUrl || "")
  const fileName = proof.name || "Minh chứng đính kèm"

  const handleImageError = async () => {
    if (proof?.dataUrl && proof.dataUrl !== safeUrl) {
      setBlobSrc(proof.dataUrl)
      return
    }
    if (safeUrl && !safeUrl.startsWith("data:") && !blobSrc) {
      try {
        const response = await fetch(safeUrl, { method: "GET", mode: "cors" })
        if (response.ok) {
          const blob = await response.blob()
          if (blob && blob.size > 0) {
            setBlobSrc(URL.createObjectURL(blob))
            return
          }
        }
      } catch (err) {
        console.warn("Direct blob fetch fallback failed:", err)
      }
    }
    setImgError(true)
  }

  const handleDownload = async () => {
    const activeUrl = blobSrc || safeUrl || proof.url || proof.dataUrl
    if (!activeUrl) return
    setDownloading(true)
    try {
      await downloadProofFile(activeUrl, fileName)
    } finally {
      setDownloading(false)
    }
  }

  const handleOpenOriginal = () => {
    const activeUrl = blobSrc || safeUrl || proof.url || proof.dataUrl
    if (!activeUrl) return
    const targetUrl = activeUrl
    // If it's a huge data URL, create a blob window
    if (targetUrl.startsWith("data:")) {
      const win = window.open()
      if (win) {
        if (category === "IMAGE") {
          win.document.write(`<title>${fileName}</title><body style="margin:0;background:#0f172a;display:flex;align-items:center;justify-content:center;height:100vh;"><img src="${targetUrl}" style="max-width:100%;max-height:100%;object-fit:contain;"/></body>`)
        } else {
          win.location.href = targetUrl
        }
        return
      }
    }
    window.open(targetUrl, "_blank", "noopener,noreferrer")
  }

  return (
    <Modal
      open={!!proof}
      wide
      title={`Xem tài liệu minh chứng: ${fileName}`}
      onClose={onClose}
      footer={
        <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant="primary"
              onClick={handleDownload}
              loading={downloading}
              className="text-xs h-9 px-3 w-full sm:w-auto"
            >
              <Download className="size-3.5" />
              Tải xuống tệp
            </Button>

            <Button
              variant="secondary"
              onClick={handleOpenOriginal}
              className="text-xs h-9 px-3 w-full sm:w-auto"
            >
              <ExternalLink className="size-3.5" />
              Mở tệp gốc
            </Button>
          </div>

          <Button variant="secondary" onClick={onClose} className="text-xs h-9 px-4 w-full sm:w-auto">
            Đóng
          </Button>
        </div>
      }
    >
      <div className="flex min-h-[440px] max-h-[72vh] items-center justify-center p-3 bg-slate-900/5 border border-slate-200/80 rounded-xl overflow-hidden">
        {/* 1. IMAGE PREVIEW */}
        {category === "IMAGE" && (
          <div className="w-full flex flex-col items-center justify-center p-2">
            {!imgError && (blobSrc || safeUrl) ? (
              <img
                src={blobSrc || safeUrl}
                alt={fileName}
                onError={handleImageError}
                className="max-h-[60vh] max-w-full rounded-lg object-contain shadow-sm bg-white select-none transition-transform"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-8 max-w-md bg-white rounded-xl border border-slate-200 shadow-xs">
                <div className="size-14 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
                  <AlertCircle className="size-7" />
                </div>
                <h4 className="font-bold text-slate-800 text-sm">{fileName}</h4>
                <p className="text-xs text-slate-500 mt-1 mb-4 leading-relaxed">
                  Không thể tải bản xem trước trực tiếp từ máy chủ lưu trữ (có thể do phiên kết nối hoặc phiên bản tệp). Bạn vẫn có thể tải xuống hoặc mở tệp gốc để xem.
                </p>
                <div className="flex items-center gap-2">
                  <Button variant="primary" onClick={handleDownload} className="text-xs h-8 px-3">
                    <Download className="size-3.5" /> Tải xuống tệp ảnh
                  </Button>
                  <Button variant="secondary" onClick={handleOpenOriginal} className="text-xs h-8 px-3">
                    <ExternalLink className="size-3.5" /> Thử mở tệp gốc
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 2. PDF PREVIEW */}
        {category === "PDF" && (
          <div className="w-full h-[62vh] flex flex-col items-center gap-2">
            {safeUrl ? (
              <iframe
                src={safeUrl}
                title={fileName}
                className="w-full h-full rounded-lg border border-slate-200 bg-white"
              />
            ) : (
              <div className="flex flex-col items-center justify-center m-auto p-6 bg-white rounded-xl border border-slate-200 text-center">
                <FileText className="size-12 text-rose-500 mb-2" />
                <p className="font-semibold text-slate-800 text-sm">{fileName}</p>
                <p className="text-xs text-slate-500 mt-1 mb-3">Tài liệu định dạng PDF</p>
                <Button variant="primary" onClick={handleDownload} className="text-xs h-8">
                  <Download className="size-3.5" /> Tải xuống PDF
                </Button>
              </div>
            )}
          </div>
        )}

        {/* 3. EXCEL PREVIEW */}
        {category === "EXCEL" && (
          <div className="flex flex-col items-center justify-center p-8 text-center bg-white rounded-xl border border-slate-200 shadow-xs max-w-lg w-full">
            <div className="size-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 shadow-2xs">
              <FileSpreadsheet className="size-8" />
            </div>
            <h3 className="font-bold text-slate-800 text-base">{fileName}</h3>
            <p className="text-xs text-slate-500 mt-1 mb-5">
              Bảng tính Microsoft Excel / CSV (.xlsx, .xls)
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 w-full">
              <Button variant="primary" onClick={handleDownload} className="text-xs h-9 px-4">
                <Download className="size-4" /> Tải xuống tệp Excel
              </Button>
              <Button variant="secondary" onClick={handleOpenOriginal} className="text-xs h-9 px-4">
                <ExternalLink className="size-4" /> Mở tệp gốc
              </Button>
            </div>
          </div>
        )}

        {/* 4. WORD PREVIEW */}
        {category === "WORD" && (
          <div className="flex flex-col items-center justify-center p-8 text-center bg-white rounded-xl border border-slate-200 shadow-xs max-w-lg w-full">
            <div className="size-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3 shadow-2xs">
              <FileText className="size-8" />
            </div>
            <h3 className="font-bold text-slate-800 text-base">{fileName}</h3>
            <p className="text-xs text-slate-500 mt-1 mb-5">
              Tài liệu văn bản Microsoft Word (.docx, .doc)
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 w-full">
              <Button variant="primary" onClick={handleDownload} className="text-xs h-9 px-4">
                <Download className="size-4" /> Tải xuống tệp Word
              </Button>
              <Button variant="secondary" onClick={handleOpenOriginal} className="text-xs h-9 px-4">
                <ExternalLink className="size-4" /> Mở tệp gốc
              </Button>
            </div>
          </div>
        )}

        {/* 5. OTHER FILE TYPES */}
        {category !== "IMAGE" && category !== "PDF" && category !== "EXCEL" && category !== "WORD" && (
          <div className="flex flex-col items-center justify-center p-8 text-center bg-white rounded-xl border border-slate-200 shadow-xs max-w-lg w-full">
            <div className="size-16 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center mb-3 shadow-2xs">
              <File className="size-8" />
            </div>
            <h3 className="font-bold text-slate-800 text-base">{fileName}</h3>
            <p className="text-xs text-slate-500 mt-1 mb-5">Tài liệu đính kèm hệ thống</p>
            <div className="flex flex-wrap items-center justify-center gap-2 w-full">
              <Button variant="primary" onClick={handleDownload} className="text-xs h-9 px-4">
                <Download className="size-4" /> Tải xuống tệp
              </Button>
              <Button variant="secondary" onClick={handleOpenOriginal} className="text-xs h-9 px-4">
                <ExternalLink className="size-4" /> Mở tệp gốc
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
