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
  Loader2,
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
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [downloading, setDownloading] = useState(false)

  // Reset error state when proof changes
  useEffect(() => {
    setImgError(false)
    setBlobSrc(null)
    setPdfBlobUrl(null)
    setPdfLoading(false)
  }, [proof?.url, proof?.name, proof?.dataUrl])

  const category = proof ? getProofCategory(proof) : "OTHER"
  const safeUrl = proof?.url ? getProofUrl(proof.url) : (proof?.dataUrl || "")
  const fileName = proof?.name || "Minh chứng đính kèm"

  // Prepare PDF as a native Blob URL to ensure full pagination, toolbar, and zoom controls
  useEffect(() => {
    if (!proof || category !== "PDF" || !safeUrl) {
      setPdfBlobUrl(null)
      setPdfLoading(false)
      return
    }

    let isCancelled = false
    let createdUrl = null

    const preparePdf = async () => {
      setPdfLoading(true)

      // If already a blob URL, use it directly
      if (safeUrl.startsWith("blob:")) {
        setPdfBlobUrl(safeUrl)
        setPdfLoading(false)
        return
      }

      // If data URL, convert to blob URL for seamless PDF rendering and native page navigation
      if (safeUrl.startsWith("data:")) {
        try {
          const res = await fetch(safeUrl)
          const blob = await res.blob()
          if (!isCancelled && blob && blob.size > 0) {
            createdUrl = URL.createObjectURL(blob)
            setPdfBlobUrl(createdUrl)
          }
        } catch (err) {
          console.warn("Data URL to blob conversion failed:", err)
          if (!isCancelled) setPdfBlobUrl(safeUrl)
        } finally {
          if (!isCancelled) setPdfLoading(false)
        }
        return
      }

      // Remote HTTP URL: fetch as blob to render via local blob URL with full browser PDF controls
      try {
        const res = await fetch(safeUrl, { method: "GET", mode: "cors" })
        if (res.ok) {
          const blob = await res.blob()
          if (!isCancelled && blob && blob.size > 0) {
            createdUrl = URL.createObjectURL(blob)
            setPdfBlobUrl(createdUrl)
            setPdfLoading(false)
            return
          }
        }
      } catch (fetchErr) {
        console.warn("Remote PDF blob fetch failed, fallback to direct safeUrl:", fetchErr)
      }

      if (!isCancelled) {
        setPdfBlobUrl(safeUrl)
        setPdfLoading(false)
      }
    }

    preparePdf()

    return () => {
      isCancelled = true
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl)
      }
    }
  }, [proof, safeUrl, category])

  if (!proof) return null

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
    const activeUrl = pdfBlobUrl || blobSrc || safeUrl || proof.url || proof.dataUrl
    if (!activeUrl) return
    setDownloading(true)
    try {
      await downloadProofFile(activeUrl, fileName)
    } finally {
      setDownloading(false)
    }
  }

  const handleOpenOriginal = () => {
    const activeUrl = pdfBlobUrl || blobSrc || safeUrl || proof.url || proof.dataUrl
    if (!activeUrl) return

    // If it's a data URL, convert to Blob URL first so Chrome won't block top-level navigation
    if (activeUrl.startsWith("data:")) {
      try {
        const arr = activeUrl.split(",")
        const mime = arr[0].match(/:(.*?);/)[1]
        const bstr = atob(arr[1])
        let n = bstr.length
        const u8arr = new Uint8Array(n)
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n)
        }
        const blob = new Blob([u8arr], { type: mime })
        const tempBlobUrl = URL.createObjectURL(blob)
        const win = window.open(tempBlobUrl, "_blank", "noopener,noreferrer")
        if (!win) {
          window.location.href = tempBlobUrl
        }
        setTimeout(() => URL.revokeObjectURL(tempBlobUrl), 60000)
        return
      } catch (e) {
        console.warn("Failed to open data URL via blob:", e)
      }
    }

    window.open(activeUrl, "_blank", "noopener,noreferrer")
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
            {pdfLoading ? (
              <div className="flex flex-col items-center justify-center m-auto p-6 bg-white rounded-xl border border-slate-200 text-center">
                <Loader2 className="size-8 animate-spin text-brand mb-2" />
                <p className="text-xs font-semibold text-slate-700">Đang nạp xem trước tài liệu PDF...</p>
                <p className="text-[11px] text-slate-400 mt-0.5">{fileName}</p>
              </div>
            ) : (pdfBlobUrl || safeUrl) ? (
              <iframe
                src={pdfBlobUrl || safeUrl}
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
