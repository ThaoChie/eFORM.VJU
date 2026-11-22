/**
 * Utility xử lý ảnh chữ ký số cho hệ thống E-Form VJU:
 * - Tách nền giấy tự động (Transparent Background Removal)
 * - Tối ưu hóa nét bút và khử bóng mờ chụp tài liệu
 * - Tự động xén lề (Auto-trim / Auto-crop)
 */

const signatureCache = new Map()

/**
 * Tách nền giấy ảnh chữ ký bằng HTML5 Canvas:
 * Biến toàn bộ nền giấy (màu trắng, xám, ngà, bóng mờ chụp từ điện thoại) thành trong suốt 100%,
 * chỉ giữ lại nét mực chữ ký sắc nét và sạch sẽ khi chèn lên phôi PDF.
 *
 * @param {string} imageSource DataURL hoặc URL ảnh chữ ký
 * @returns {Promise<string>} DataURL PNG trong suốt
 */
export function removePaperBackground(imageSource, options = {}) {
  const { autoTrim = true } = options
  return new Promise((resolve) => {
    if (!imageSource || typeof imageSource !== "string") {
      return resolve(imageSource)
    }

    const cacheKey = `${autoTrim ? "trim" : "full"}:${imageSource}`
    // Nếu đã cache kết quả tách nền của nguồn ảnh này
    if (signatureCache.has(cacheKey)) {
      return resolve(signatureCache.get(cacheKey))
    }

    // Nếu là SVG đã có nền trong suốt
    if (imageSource.startsWith("data:image/svg+xml")) {
      return resolve(imageSource)
    }

    const img = new Image()
    img.crossOrigin = "anonymous"

    img.onload = () => {
      try {
        const width = img.naturalWidth || img.width
        const height = img.naturalHeight || img.height
        if (!width || !height) {
          return resolve(imageSource)
        }

        const canvas = document.createElement("canvas")
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext("2d", { willReadFrequently: true })
        if (!ctx) {
          return resolve(imageSource)
        }

        ctx.drawImage(img, 0, 0)
        const imgData = ctx.getImageData(0, 0, width, height)
        const d = imgData.data

        // 1. Kiểm tra xem ảnh đã có nền trong suốt hay chưa
        let transparentPixelCount = 0
        const totalPixels = width * height
        const sampleLimit = Math.min(totalPixels, 3000)
        const step = Math.max(1, Math.floor(totalPixels / sampleLimit))
        for (let i = 0; i < totalPixels; i += step) {
          const idx = i * 4
          if (d[idx + 3] < 50) {
            transparentPixelCount++
          }
        }
        // Nếu đã có hơn 12% pixel trong suốt thì ảnh đã có kênh Alpha sẵn
        if (transparentPixelCount > (sampleLimit * 0.12)) {
          signatureCache.set(cacheKey, imageSource)
          return resolve(imageSource)
        }

        // 2. Lấy mẫu màu nền giấy ở 4 góc và viền biên (corner sampling)
        let totalR = 0, totalG = 0, totalB = 0, sampleCount = 0
        const cornerSize = Math.max(4, Math.min(25, Math.floor(Math.min(width, height) * 0.1)))

        const samplePixel = (x, y) => {
          const idx = (y * width + x) * 4
          const a = d[idx + 3]
          if (a > 200) {
            totalR += d[idx]
            totalG += d[idx + 1]
            totalB += d[idx + 2]
            sampleCount++
          }
        }

        for (let y = 0; y < cornerSize; y++) {
          for (let x = 0; x < cornerSize; x++) {
            samplePixel(x, y)
            samplePixel(width - 1 - x, y)
            samplePixel(x, height - 1 - y)
            samplePixel(width - 1 - x, height - 1 - y)
          }
        }

        const bgR = sampleCount > 0 ? totalR / sampleCount : 240
        const bgG = sampleCount > 0 ? totalG / sampleCount : 240
        const bgB = sampleCount > 0 ? totalB / sampleCount : 240
        const bgLum = 0.299 * bgR + 0.587 * bgG + 0.114 * bgB

        // Ngưỡng nhận diện giấy: các pixel có độ sáng gần nền hoặc gần màu nền mẫu
        const paperThreshold = Math.max(80, Math.min(245, bgLum - 15))
        const inkThreshold = Math.max(25, paperThreshold - 60)

        let minX = width, minY = height, maxX = 0, maxY = 0

        // 3. Quét từng pixel và tách nền
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4
            const r = d[idx]
            const g = d[idx + 1]
            const b = d[idx + 2]
            const a = d[idx + 3]

            if (a < 30) continue

            const lum = 0.299 * r + 0.587 * g + 0.114 * b
            const colorDist = Math.sqrt(
              Math.pow(r - bgR, 2) + Math.pow(g - bgG, 2) + Math.pow(b - bgB, 2)
            )

            if (lum >= paperThreshold || colorDist < 42) {
              // Là giấy hoặc bóng mờ nền -> Trong suốt hoàn toàn
              d[idx + 3] = 0
            } else if (lum <= inkThreshold) {
              // Nét mực đậm -> Giữ alpha 255
              d[idx + 3] = 255
              minX = Math.min(minX, x)
              minY = Math.min(minY, y)
              maxX = Math.max(maxX, x)
              maxY = Math.max(maxY, y)
            } else {
              // Vùng chuyển tiếp (anti-aliasing) viền nét bút
              const factor = (paperThreshold - lum) / (paperThreshold - inkThreshold)
              const newAlpha = Math.round(Math.min(255, Math.max(0, Math.pow(factor, 1.25) * 255)))
              d[idx + 3] = newAlpha
              if (newAlpha > 35) {
                minX = Math.min(minX, x)
                minY = Math.min(minY, y)
                maxX = Math.max(maxX, x)
                maxY = Math.max(maxY, y)
              }
            }
          }
        }

        ctx.putImageData(imgData, 0, 0)

        // 4. Tự động xén lề (Auto-trim bounding box) nếu autoTrim = true
        let finalDataUrl = ""
        if (autoTrim && maxX > minX && maxY > minY) {
          const padding = 10
          const cropX = Math.max(0, minX - padding)
          const cropY = Math.max(0, minY - padding)
          const cropW = Math.min(width - cropX, (maxX - minX) + padding * 2)
          const cropH = Math.min(height - cropY, (maxY - minY) + padding * 2)

          const trimmedCanvas = document.createElement("canvas")
          trimmedCanvas.width = cropW
          trimmedCanvas.height = cropH
          const trimmedCtx = trimmedCanvas.getContext("2d")
          trimmedCtx.drawImage(canvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH)
          finalDataUrl = trimmedCanvas.toDataURL("image/png")
        } else {
          finalDataUrl = canvas.toDataURL("image/png")
        }

        signatureCache.set(cacheKey, finalDataUrl)
        resolve(finalDataUrl)
      } catch (err) {
        console.warn("Background removal error:", err)
        resolve(imageSource)
      }
    }

    img.onerror = () => {
      resolve(imageSource)
    }

    img.src = imageSource
  })
}

export async function computeStringSha256(str) {
  if (!str || typeof str !== "string") return ""
  try {
    if (typeof crypto !== "undefined" && crypto.subtle) {
      const encoder = new TextEncoder()
      const data = encoder.encode(str)
      const hashBuffer = await crypto.subtle.digest("SHA-256", data)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
    }
  } catch {}
  return ""
}

function extractCanvasInkProfile(dataUrl) {
  return new Promise((resolve) => {
    if (!dataUrl || typeof dataUrl !== "string" || dataUrl.startsWith("data:image/svg+xml")) {
      return resolve(null)
    }
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      try {
        const width = img.naturalWidth || img.width
        const height = img.naturalHeight || img.height
        if (!width || !height) return resolve(null)

        const canvas = document.createElement("canvas")
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext("2d", { willReadFrequently: true })
        if (!ctx) return resolve(null)
        ctx.drawImage(img, 0, 0)
        const d = ctx.getImageData(0, 0, width, height).data

        let cornerPixels = 0
        let totalBrightness = 0
        let transparentCornerCount = 0
        const cLimitY = Math.min(20, height)
        const cLimitX = Math.min(20, width)
        for (let y = 0; y < cLimitY; y++) {
          for (let x = 0; x < cLimitX; x++) {
            const idx = (y * width + x) * 4
            const a = d[idx + 3]
            if (a < 50) {
              transparentCornerCount++
            } else {
              totalBrightness += 0.299 * d[idx] + 0.587 * d[idx + 1] + 0.114 * d[idx + 2]
              cornerPixels++
            }
          }
        }
        const hasTransparency = transparentCornerCount > 5
        const bgBrightness = cornerPixels > 0 ? totalBrightness / cornerPixels : 230
        const paperThreshold = hasTransparency ? 225 : Math.max(80, bgBrightness - 15)

        const inkMask = new Uint8Array(width * height)
        let minX = width, minY = height, maxX = -1, maxY = -1
        let totalInkPixels = 0

        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4
            const a = d[idx + 3]
            if (a < 45) continue
            const lum = 0.299 * d[idx] + 0.587 * d[idx + 1] + 0.114 * d[idx + 2]
            if (lum < paperThreshold) {
              inkMask[y * width + x] = 1
              totalInkPixels++
              if (x < minX) minX = x
              if (y < minY) minY = y
              if (x > maxX) maxX = x
              if (y > maxY) maxY = y
            }
          }
        }

        const gridW = 32
        const gridH = 16
        const grid = new Uint8Array(gridW * gridH)

        if (totalInkPixels >= 10 && maxX > minX && maxY > minY) {
          const boxW = maxX - minX + 1
          const boxH = maxY - minY + 1
          for (let gy = 0; gy < gridH; gy++) {
            const y0 = minY + Math.floor((gy * boxH) / gridH)
            const y1 = Math.max(y0 + 1, minY + Math.floor(((gy + 1) * boxH) / gridH))
            for (let gx = 0; gx < gridW; gx++) {
              const x0 = minX + Math.floor((gx * boxW) / gridW)
              const x1 = Math.max(x0 + 1, minX + Math.floor(((gx + 1) * boxW) / gridW))
              let inkCount = 0
              let cellArea = 0
              for (let y = y0; y < Math.min(height, y1); y++) {
                for (let x = x0; x < Math.min(width, x1); x++) {
                  cellArea++
                  if (inkMask[y * width + x]) inkCount++
                }
              }
              grid[gy * gridW + gx] = cellArea > 0 && inkCount / cellArea >= 0.05 ? 1 : 0
            }
          }
          return resolve({ grid, aspectRatio: boxW / boxH, mode: "ink" })
        }

        // Fallback cho ảnh test đồng màu / ảnh không tách được nét mực: lấy lưới độ sáng 16x16
        const smallCanvas = document.createElement("canvas")
        smallCanvas.width = 16
        smallCanvas.height = 16
        const sCtx = smallCanvas.getContext("2d")
        sCtx.drawImage(img, 0, 0, 16, 16)
        const sData = sCtx.getImageData(0, 0, 16, 16).data
        return resolve({ rgba: Array.from(sData), aspectRatio: width / height, mode: "rgba" })
      } catch {
        return resolve(null)
      }
    }
    img.onerror = () => resolve(null)
    img.src = dataUrl
  })
}

export async function areSignaturesVisuallyIdentical(sig1, sig2) {
  if (!sig1 || !sig2) return false
  const s1 = String(sig1).trim()
  const s2 = String(sig2).trim()
  if (!s1 || !s2) return false
  if (s1 === s2) return true
  try {
    const [p1, p2] = await Promise.all([extractCanvasInkProfile(s1), extractCanvasInkProfile(s2)])
    if (!p1 || !p2 || p1.mode !== p2.mode) return false
    const maxAr = Math.max(p1.aspectRatio, p2.aspectRatio)
    if (maxAr > 0 && Math.abs(p1.aspectRatio - p2.aspectRatio) / maxAr > 0.22) {
      return false
    }
    if (p1.mode === "ink") {
      let same = 0, inter = 0, union = 0
      for (let i = 0; i < p1.grid.length; i++) {
        const b1 = p1.grid[i] === 1
        const b2 = p2.grid[i] === 1
        if (b1 === b2) same++
        if (b1 && b2) inter++
        if (b1 || b2) union++
      }
      if (union === 0) return false
      return same / p1.grid.length >= 0.9 && inter / union >= 0.75
    }
    if (p1.mode === "rgba" && p1.rgba && p2.rgba) {
      let diffSum = 0
      for (let i = 0; i < p1.rgba.length; i++) {
        diffSum += Math.abs(p1.rgba[i] - p2.rgba[i])
      }
      return diffSum / p1.rgba.length <= 4.0
    }
  } catch {}
  return false
}

/**
 * Xoay ảnh chữ ký 90° theo chiều kim đồng hồ (direction = 1) hoặc ngược chiều (direction = -1).
 * Đảm bảo kích thước canvas đầu ra luôn đạt chuẩn tối thiểu 300×100px.
 */
export function rotateSignatureImage90(dataUrl, direction = 1, minW = 300, minH = 100) {
  return new Promise((resolve, reject) => {
    if (!dataUrl) return reject(new Error("Không có dữ liệu ảnh để xoay"))
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      try {
        const w = img.naturalWidth || img.width
        const h = img.naturalHeight || img.height
        const rotW = h
        const rotH = w

        const rotCanvas = document.createElement("canvas")
        rotCanvas.width = rotW
        rotCanvas.height = rotH
        const rotCtx = rotCanvas.getContext("2d")
        rotCtx.translate(rotW / 2, rotH / 2)
        rotCtx.rotate((direction >= 0 ? 90 : -90) * (Math.PI / 180))
        rotCtx.drawImage(img, -w / 2, -h / 2)

        const outW = Math.max(minW, rotW)
        const outH = Math.max(minH, rotH)
        if (outW > rotW || outH > rotH) {
          const padCanvas = document.createElement("canvas")
          padCanvas.width = outW
          padCanvas.height = outH
          const padCtx = padCanvas.getContext("2d")
          padCtx.drawImage(rotCanvas, Math.floor((outW - rotW) / 2), Math.floor((outH - rotH) / 2))
          return resolve({
            dataUrl: padCanvas.toDataURL("image/png"),
            width: outW,
            height: outH,
          })
        }

        resolve({
          dataUrl: rotCanvas.toDataURL("image/png"),
          width: rotW,
          height: rotH,
        })
      } catch (err) {
        reject(err)
      }
    }
    img.onerror = () => reject(new Error("Không thể tải ảnh để xoay"))
    img.src = dataUrl
  })
}

/**
 * Tự động xác định vùng cắt sát lề chữ ký nhưng vẫn đảm bảo vùng cắt >= 300×100px.
 */
export function detectTightSignatureCropBox(dataUrl, minW = 300, minH = 100) {
  return new Promise((resolve) => {
    if (!dataUrl) return resolve(null)
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      try {
        const width = img.naturalWidth || img.width
        const height = img.naturalHeight || img.height
        const canvas = document.createElement("canvas")
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext("2d", { willReadFrequently: true })
        ctx.drawImage(img, 0, 0)
        const d = ctx.getImageData(0, 0, width, height).data

        let minX = width, minY = height, maxX = -1, maxY = -1
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4
            const a = d[idx + 3]
            if (a < 35) continue
            const lum = 0.299 * d[idx] + 0.587 * d[idx + 1] + 0.114 * d[idx + 2]
            if (lum < 225) {
              if (x < minX) minX = x
              if (y < minY) minY = y
              if (x > maxX) maxX = x
              if (y > maxY) maxY = y
            }
          }
        }

        const targetMinW = Math.min(width, minW)
        const targetMinH = Math.min(height, minH)

        if (maxX <= minX || maxY <= minY) {
          // Nếu ảnh đồng màu chưa tách được nét mực, co sát lề 12% nhưng vẫn giữ >= 300x100px
          const defaultW = Math.max(targetMinW, Math.round(width * 0.8))
          const defaultH = Math.max(targetMinH, Math.round(height * 0.8))
          return resolve({
            x: Math.floor((width - defaultW) / 2),
            y: Math.floor((height - defaultH) / 2),
            width: defaultW,
            height: defaultH,
            imgWidth: width,
            imgHeight: height,
          })
        }

        const pad = 12
        let boxX = Math.max(0, minX - pad)
        let boxY = Math.max(0, minY - pad)
        let boxW = Math.min(width - boxX, maxX - minX + pad * 2)
        let boxH = Math.min(height - boxY, maxY - minY + pad * 2)

        if (boxW < targetMinW) {
          const centerX = boxX + boxW / 2
          boxW = targetMinW
          boxX = Math.max(0, Math.min(width - boxW, Math.round(centerX - boxW / 2)))
        }
        if (boxH < targetMinH) {
          const centerY = boxY + boxH / 2
          boxH = targetMinH
          boxY = Math.max(0, Math.min(height - boxH, Math.round(centerY - boxH / 2)))
        }

        resolve({
          x: boxX,
          y: boxY,
          width: boxW,
          height: boxH,
          imgWidth: width,
          imgHeight: height,
        })
      } catch {
        resolve(null)
      }
    }
    img.onerror = () => resolve(null)
    img.src = dataUrl
  })
}

/**
 * Cắt ảnh chữ ký theo vùng chọn cropRect = { x, y, width, height }, đảm bảo ảnh sau cắt luôn >= 300×100px.
 */
export function cropSignatureImage(dataUrl, cropRect, minW = 300, minH = 100) {
  return new Promise((resolve, reject) => {
    if (!dataUrl || !cropRect) return reject(new Error("Thông tin vùng cắt không hợp lệ"))
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      try {
        const imgW = img.naturalWidth || img.width
        const imgH = img.naturalHeight || img.height

        const targetMinW = Math.min(imgW, minW)
        const targetMinH = Math.min(imgH, minH)

        let cw = Math.max(targetMinW, Math.min(imgW, Math.round(cropRect.width || imgW)))
        let ch = Math.max(targetMinH, Math.min(imgH, Math.round(cropRect.height || imgH)))
        let cx = Math.max(0, Math.min(imgW - cw, Math.round(cropRect.x || 0)))
        let cy = Math.max(0, Math.min(imgH - ch, Math.round(cropRect.y || 0)))

        const outW = Math.max(minW, cw)
        const outH = Math.max(minH, ch)

        const outCanvas = document.createElement("canvas")
        outCanvas.width = outW
        outCanvas.height = outH
        const outCtx = outCanvas.getContext("2d")
        const offsetX = Math.floor((outW - cw) / 2)
        const offsetY = Math.floor((outH - ch) / 2)

        outCtx.drawImage(img, cx, cy, cw, ch, offsetX, offsetY, cw, ch)
        resolve({
          dataUrl: outCanvas.toDataURL("image/png"),
          width: outW,
          height: outH,
        })
      } catch (err) {
        reject(err)
      }
    }
    img.onerror = () => reject(new Error("Không thể tải ảnh để cắt"))
    img.src = dataUrl
  })
}
