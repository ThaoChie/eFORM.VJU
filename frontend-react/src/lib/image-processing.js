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
export function removePaperBackground(imageSource) {
  return new Promise((resolve) => {
    if (!imageSource || typeof imageSource !== "string") {
      return resolve(imageSource)
    }

    // Nếu đã cache kết quả tách nền của nguồn ảnh này
    if (signatureCache.has(imageSource)) {
      return resolve(signatureCache.get(imageSource))
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
          signatureCache.set(imageSource, imageSource)
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

        // 4. Tự động xén lề (Auto-trim bounding box) để chữ ký vừa vặn
        let finalDataUrl = ""
        if (maxX > minX && maxY > minY) {
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

        signatureCache.set(imageSource, finalDataUrl)
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
