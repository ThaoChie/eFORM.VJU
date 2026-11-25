package vn.edu.drl.backend.service.engine;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.pdfbox.text.TextPosition;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Service
public class PdfSignatureEngine {

    private static final Logger log = LoggerFactory.getLogger(PdfSignatureEngine.class);

    /**
     * Vị trí của Marker Tag phát hiện trong tài liệu PDF
     */
    public static class MarkerLocation {
        public final int pageIndex; // 0-based
        public final float x;        // Tọa độ X tính từ mép trái trang (Point)
        public final float y;        // Khoảng cách từ đỉnh trang xuống (Point)
        public final float width;    // Chiều rộng cụm từ marker
        public final float height;   // Chiều cao cụm từ marker
        public final String matchedTag;

        public MarkerLocation(int pageIndex, float x, float y, float width, float height, String matchedTag) {
            this.pageIndex = pageIndex;
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
            this.matchedTag = matchedTag;
        }

        @Override
        public String toString() {
            return String.format("MarkerLocation{tag='%s', page=%d, x=%.1f, y=%.1f, w=%.1f, h=%.1f}",
                    matchedTag, pageIndex, x, y, width, height);
        }
    }

    /**
     * TextStripper quét toàn bộ nội dung PDF để dò tìm vị trí tọa độ của Marker Tag
     */
    private static class MarkerStripper extends PDFTextStripper {
        private final List<String> candidateTags;
        private MarkerLocation foundLocation = null;

        public MarkerStripper(List<String> candidateTags) throws IOException {
            this.candidateTags = candidateTags;
        }

        @Override
        protected void writeString(String text, List<TextPosition> textPositions) throws IOException {
            if (foundLocation == null && text != null && textPositions != null) {
                for (String tag : candidateTags) {
                    if (tag != null && !tag.isEmpty() && text.contains(tag)) {
                        int startIndex = text.indexOf(tag);
                        int endIndex = startIndex + tag.length();

                        if (startIndex >= 0 && startIndex < textPositions.size() && endIndex <= textPositions.size()) {
                            TextPosition first = textPositions.get(startIndex);
                            TextPosition last = textPositions.get(endIndex - 1);

                            float x = first.getXDirAdj();
                            float y = first.getYDirAdj();
                            float width = (last.getXDirAdj() + last.getWidthDirAdj()) - x;
                            float height = first.getHeightDir();
                            int pageIndex = Math.max(0, getCurrentPageNo() - 1);

                            foundLocation = new MarkerLocation(pageIndex, x, y, width, height, tag);
                            break;
                        }
                    }
                }
            }
            super.writeString(text, textPositions);
        }

        public MarkerLocation getFoundLocation() {
            return foundLocation;
        }
    }

    /**
     * Dò tìm vị trí của từ khóa đánh dấu (Marker Tag / Anchor Text) trong file PDF
     */
    public MarkerLocation findMarkerLocation(PDDocument document, String primaryTag, String[] aliases) {
        if (document == null || (primaryTag == null && (aliases == null || aliases.length == 0))) {
            return null;
        }

        List<String> tags = new ArrayList<>();
        if (primaryTag != null && !primaryTag.trim().isEmpty()) {
            tags.add(primaryTag.trim());
        }
        if (aliases != null) {
            for (String a : aliases) {
                if (a != null && !a.trim().isEmpty() && !tags.contains(a.trim())) {
                    tags.add(a.trim());
                }
            }
        }

        try {
            MarkerStripper stripper = new MarkerStripper(tags);
            stripper.getText(document);
            return stripper.getFoundLocation();
        } catch (Exception e) {
            log.warn("Không thể quét marker trong PDF: {}", e.getMessage());
            return null;
        }
    }

    /**
     * Chèn ảnh chữ ký động theo Anchor Text / Marker Tag trong tài liệu PDF.
     * Tự động xác định chính xác Trang, Tọa độ X, Tọa độ Y theo marker.
     * Nếu tài liệu phôi cũ không có marker tag, tự động fallback về tọa độ chỉ định trên trang cuối.
     *
     * @param pdfBytes     Dữ liệu nhị phân file PDF gốc
     * @param imageBytes   Ảnh chữ ký (PNG/JPEG)
     * @param primaryTag   Marker Tag chính (VD: [[SIG_STUDENT]], [[SIG_CLASS]], [[SIG_DEAN]])
     * @param aliases      Các alias phụ (VD: {{ sig_student_image }}, [SIG_STUDENT])
     * @param fallbackX    Tọa độ X dự phòng (nếu không tìm thấy marker)
     * @param fallbackY    Tọa độ Y dự phòng (nếu không tìm thấy marker)
     * @return File PDF sau khi chèn chữ ký
     */
    public byte[] insertSignatureByMarker(byte[] pdfBytes, byte[] imageBytes, String primaryTag, String[] aliases, float fallbackX, float fallbackY) {
        if (pdfBytes == null || pdfBytes.length == 0 || imageBytes == null || imageBytes.length == 0) {
            return pdfBytes;
        }

        try (PDDocument document = Loader.loadPDF(pdfBytes)) {
            MarkerLocation loc = findMarkerLocation(document, primaryTag, aliases);

            PDPage page;
            float imageWidth = 110f;
            float imageHeight = 50f;
            float x;
            float y;

            if (loc != null && loc.pageIndex >= 0 && loc.pageIndex < document.getNumberOfPages()) {
                page = document.getPage(loc.pageIndex);
                float pageHeight = page.getCropBox().getHeight();
                float pageWidth = page.getCropBox().getWidth();

                // Căn giữa ảnh chữ ký theo chiều ngang của Marker
                x = loc.x + (loc.width - imageWidth) / 2.0f;
                // Chuyển đổi hệ tọa độ PDF (gốc 0,0 ở góc dưới-trái) từ khoảng cách từ đỉnh (loc.y)
                float baselineY = pageHeight - loc.y;
                // Đặt ảnh chữ ký phía trên đường chân chữ ký (baseline) một chút để đè khớp tự nhiên
                y = baselineY - (imageHeight * 0.35f);

                // Giới hạn trong khung trang để tránh tràn mép giấy
                x = Math.max(15f, Math.min(x, pageWidth - imageWidth - 15f));
                y = Math.max(15f, Math.min(y, pageHeight - imageHeight - 15f));

                log.info("Phát hiện marker '{}' tại trang {}, chèn chữ ký tại (x={:.1f}, y={:.1f})",
                        loc.matchedTag, loc.pageIndex + 1, x, y);

                PDImageXObject pdImage = PDImageXObject.createFromByteArray(document, imageBytes, "signature");

                try (PDPageContentStream cs = new PDPageContentStream(document, page, PDPageContentStream.AppendMode.APPEND, true, true)) {
                    // Xóa mờ cụm từ marker bằng hộp chữ nhật màu trắng trước khi vẽ chữ ký đè lên
                    cs.setNonStrokingColor(1.0f, 1.0f, 1.0f);
                    cs.addRect(loc.x - 2f, baselineY - 3f, loc.width + 4f, Math.max(loc.height + 4f, 12f));
                    cs.fill();

                    // Vẽ ảnh chữ ký
                    cs.drawImage(pdImage, x, y, imageWidth, imageHeight);
                }
            } else {
                // Fallback về trang cuối theo tọa độ cố định nếu template không có marker tag
                int lastPageIndex = Math.max(0, document.getNumberOfPages() - 1);
                page = document.getPage(lastPageIndex);
                log.info("Không tìm thấy marker '{}'. Áp dụng fallback tọa độ cố định (x={}, y={}) trên trang {}",
                        primaryTag, fallbackX, fallbackY, lastPageIndex + 1);

                PDImageXObject pdImage = PDImageXObject.createFromByteArray(document, imageBytes, "signature");
                try (PDPageContentStream cs = new PDPageContentStream(document, page, PDPageContentStream.AppendMode.APPEND, true, true)) {
                    cs.drawImage(pdImage, fallbackX, fallbackY, 100f, 50f);
                }
            }

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            document.save(baos);
            return baos.toByteArray();
        } catch (Exception e) {
            log.error("Lỗi khi chèn chữ ký vào PDF: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to insert signature image: " + e.getMessage());
        }
    }

    /**
     * Phương thức tương thích ngược giữ nguyên chữ ký hàm cũ
     */
    public byte[] insertSignatureImage(byte[] pdfBytes, byte[] imageBytes, float x, float y) {
        return insertSignatureByMarker(pdfBytes, imageBytes, null, null, x, y);
    }
}
