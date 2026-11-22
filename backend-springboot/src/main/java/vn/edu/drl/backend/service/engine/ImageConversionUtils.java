package vn.edu.drl.backend.service.engine;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.nio.file.Files;
import java.util.Base64;
import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.awt.BasicStroke;
import java.awt.Color;
import java.awt.Font;
import java.awt.FontMetrics;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.geom.Path2D;

public class ImageConversionUtils {

    public static boolean isHeic(String base64OrDataUrl) {
        if (base64OrDataUrl == null || base64OrDataUrl.length() < 20) return false;
        if (base64OrDataUrl.contains("ftypheic") || base64OrDataUrl.contains("image/heic") || base64OrDataUrl.contains("image/heif")) {
            return true;
        }
        String raw = base64OrDataUrl.contains(",") ? base64OrDataUrl.split(",")[1].trim() : base64OrDataUrl.trim();
        if (raw.length() > 30 && raw.substring(0, 30).contains("Z0eX")) {
            return true;
        }
        try {
            byte[] header = Base64.getDecoder().decode(raw.substring(0, Math.min(60, raw.length())));
            if (header.length >= 8 && header[4] == 'f' && header[5] == 't' && header[6] == 'y' && header[7] == 'p') {
                return true;
            }
        } catch (Exception ignored) {}
        return false;
    }

    public static String ensureStandardWebImage(String base64OrDataUrl) {
        if (base64OrDataUrl == null || base64OrDataUrl.trim().isEmpty()) {
            return base64OrDataUrl;
        }
        String converted = base64OrDataUrl;
        if (isHeic(base64OrDataUrl)) {
            try {
                String raw = base64OrDataUrl.contains(",") ? base64OrDataUrl.split(",")[1].trim() : base64OrDataUrl.trim();
                byte[] bytes = Base64.getDecoder().decode(raw);

                File tempHeic = File.createTempFile("sig_heic_", ".heic");
                File tempPng = File.createTempFile("sig_converted_", ".png");
                Files.write(tempHeic.toPath(), bytes);

                Process process = new ProcessBuilder("sips", "-s", "format", "png", tempHeic.getAbsolutePath(), "--out", tempPng.getAbsolutePath()).start();
                int exitCode = process.waitFor();
                if (exitCode == 0 && tempPng.exists()) {
                    byte[] pngBytes = Files.readAllBytes(tempPng.toPath());
                    tempHeic.delete();
                    tempPng.delete();
                    converted = "data:image/png;base64," + Base64.getEncoder().encodeToString(pngBytes);
                }
                tempHeic.delete();
                tempPng.delete();
            } catch (Exception e) {
                System.err.println("HEIC conversion error: " + e.getMessage());
            }
        }
        return converted;
    }

    public static String removeBackground(String dataUrlOrBase64) {
        if (dataUrlOrBase64 == null || dataUrlOrBase64.trim().isEmpty()) {
            return dataUrlOrBase64;
        }
        if (dataUrlOrBase64.startsWith("data:image/svg+xml")) {
            return dataUrlOrBase64;
        }
        try {
            String raw = dataUrlOrBase64.contains(",") ? dataUrlOrBase64.split(",")[1].trim() : dataUrlOrBase64.trim();
            byte[] imageBytes = Base64.getDecoder().decode(raw);
            BufferedImage source = ImageIO.read(new ByteArrayInputStream(imageBytes));
            if (source == null) return dataUrlOrBase64;

            int width = source.getWidth();
            int height = source.getHeight();

            // Check if source ALREADY has transparent background:
            int transparentCount = 0;
            for (int y = 0; y < Math.min(30, height); y++) {
                for (int x = 0; x < Math.min(30, width); x++) {
                    int alpha = (source.getRGB(x, y) >> 24) & 0xFF;
                    if (alpha < 50) {
                        transparentCount++;
                    }
                }
            }
            if (transparentCount > 5) {
                // Image ALREADY has alpha channel transparency! Do NOT process or corrupt it!
                return dataUrlOrBase64;
            }

            BufferedImage transparent = new BufferedImage(width, height, BufferedImage.TYPE_INT_ARGB);

            // Sample corners for paper luminance
            int cornerPixels = 0;
            long totalBrightness = 0;
            for (int y = 0; y < Math.min(25, height); y++) {
                for (int x = 0; x < Math.min(25, width); x++) {
                    int rgb = source.getRGB(x, y);
                    int r = (rgb >> 16) & 0xFF;
                    int g = (rgb >> 8) & 0xFF;
                    int b = rgb & 0xFF;
                    totalBrightness += (int)(0.299 * r + 0.587 * g + 0.114 * b);
                    cornerPixels++;
                }
            }
            double bgBrightness = cornerPixels > 0 ? (double)totalBrightness / cornerPixels : 220.0;
            double paperThreshold = Math.max(80.0, bgBrightness - 15.0);
            double inkThreshold = Math.max(25.0, paperThreshold - 60.0);

            int minX = width, minY = height, maxX = 0, maxY = 0;

            for (int y = 0; y < height; y++) {
                for (int x = 0; x < width; x++) {
                    int rgb = source.getRGB(x, y);
                    int a = (rgb >> 24) & 0xFF;
                    if (a < 20) {
                        transparent.setRGB(x, y, 0);
                        continue;
                    }

                    int r = (rgb >> 16) & 0xFF;
                    int g = (rgb >> 8) & 0xFF;
                    int b = rgb & 0xFF;
                    double lum = 0.299 * r + 0.587 * g + 0.114 * b;

                    int alpha = 0;
                    if (lum < paperThreshold) {
                        double factor = (paperThreshold - lum) / (paperThreshold - inkThreshold);
                        alpha = (int) Math.min(255, Math.max(0, factor * 255));
                        if (alpha > 40) {
                            minX = Math.min(minX, x);
                            minY = Math.min(minY, y);
                            maxX = Math.max(maxX, x);
                            maxY = Math.max(maxY, y);
                        }
                    }
                    int newPixel = (alpha << 24) | (r << 16) | (g << 8) | b;
                    transparent.setRGB(x, y, newPixel);
                }
            }

            BufferedImage result = transparent;
            if (maxX > minX && maxY > minY) {
                int pad = 12;
                int cropX = Math.max(0, minX - pad);
                int cropY = Math.max(0, minY - pad);
                int cropW = Math.min(width - cropX, (maxX - minX) + 2 * pad);
                int cropH = Math.min(height - cropY, (maxY - minY) + 2 * pad);
                result = transparent.getSubimage(cropX, cropY, cropW, cropH);
            }

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            ImageIO.write(result, "png", baos);
            return "data:image/png;base64," + Base64.getEncoder().encodeToString(baos.toByteArray());
        } catch (Exception e) {
            System.err.println("Background removal warning: " + e.getMessage());
            return dataUrlOrBase64;
        }
    }

    public static String generateSpecimenPngBase64(String name, String roleTitle, java.awt.Color color) {
        String cleanName = (name != null && !name.trim().isEmpty()) ? name.trim() : "Trưởng Khoa";
        Color strokeColor = color != null ? color : new Color(136, 19, 55);

        int width = 320;
        int height = 110;
        BufferedImage image = new BufferedImage(width, height, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g2 = image.createGraphics();

        try {
            g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
            g2.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON);

            // Nét ký uốn lượn phong cách chữ ký tay
            g2.setColor(strokeColor);
            g2.setStroke(new BasicStroke(2.8f, BasicStroke.CAP_ROUND, BasicStroke.JOIN_ROUND));

            Path2D path = new Path2D.Double();
            path.moveTo(35, 65);
            path.quadTo(75, 20, 115, 68);
            path.quadTo(155, 30, 205, 55);
            path.quadTo(245, 18, 285, 62);
            g2.draw(path);

            // Nét gạch chân chữ ký
            g2.setStroke(new BasicStroke(2.2f, BasicStroke.CAP_ROUND, BasicStroke.JOIN_ROUND));
            Path2D underline = new Path2D.Double();
            underline.moveTo(50, 78);
            underline.curveTo(130, 88, 210, 82, 275, 70);
            g2.draw(underline);

            // Tên người ký
            Font font = new Font("Serif", Font.BOLD | Font.ITALIC, 28);
            g2.setFont(font);
            FontMetrics fm = g2.getFontMetrics();
            int textX = (width - fm.stringWidth(cleanName)) / 2;
            int textY = 56;
            g2.drawString(cleanName, textX, textY);

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            ImageIO.write(image, "png", baos);
            return "data:image/png;base64," + Base64.getEncoder().encodeToString(baos.toByteArray());
        } catch (Exception e) {
            String strokeHex = String.format("#%02x%02x%02x", strokeColor.getRed(), strokeColor.getGreen(), strokeColor.getBlue());
            String svg = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 280 85\" width=\"280\" height=\"85\">"
                    + "<path d=\"M 20,55 Q 50,15 90,58 T 160,40 Q 200,12 245,55\" fill=\"none\" stroke=\"" + strokeHex + "\" stroke-width=\"2.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" opacity=\"0.85\"/>"
                    + "<path d=\"M 35,68 Q 130,76 250,58\" fill=\"none\" stroke=\"" + strokeHex + "\" stroke-width=\"2\" stroke-linecap=\"round\"/>"
                    + "<text x=\"50%\" y=\"46\" font-family=\"'Caveat', 'Dancing Script', 'Brush Script MT', cursive, sans-serif\" font-size=\"34\" font-weight=\"700\" fill=\"" + strokeHex + "\" text-anchor=\"middle\" font-style=\"italic\">"
                    + cleanName
                    + "</text></svg>";
            return "data:image/svg+xml;utf8," + java.net.URLEncoder.encode(svg, java.nio.charset.StandardCharsets.UTF_8).replace("+", "%20");
        } finally {
            g2.dispose();
        }
    }

    /**
     * So sánh 2 ảnh chữ ký (DataURL/Base64) dựa trên mặt nạ nét mực đã chuẩn hóa khung bao (tight ink bounding-box).
     * Giúp phát hiện chính xác cùng 1 ảnh chữ ký dù đã qua tách nền ở Frontend (Canvas) hay Backend (ImageIO) với padding khác nhau.
     */
    public static boolean areSignaturesVisuallyIdentical(String dataUrl1, String dataUrl2) {
        if (dataUrl1 == null || dataUrl2 == null) return false;
        String s1 = dataUrl1.trim();
        String s2 = dataUrl2.trim();
        if (s1.isEmpty() || s2.isEmpty()) return false;
        if (s1.equals(s2)) return true;
        if (s1.startsWith("data:image/svg+xml") || s2.startsWith("data:image/svg+xml")) {
            return s1.equals(s2);
        }
        try {
            InkSignatureProfile p1 = extractInkProfile(s1);
            InkSignatureProfile p2 = extractInkProfile(s2);
            if (p1 == null || p2 == null) return false;

            double maxAr = Math.max(p1.aspectRatio, p2.aspectRatio);
            if (maxAr > 0 && Math.abs(p1.aspectRatio - p2.aspectRatio) / maxAr > 0.22) {
                return false;
            }

            if (p1.rgbaFallback != null && p2.rgbaFallback != null) {
                long diffSum = 0;
                for (int i = 0; i < p1.rgbaFallback.length; i++) {
                    diffSum += Math.abs(p1.rgbaFallback[i] - p2.rgbaFallback[i]);
                }
                return ((double) diffSum / p1.rgbaFallback.length) <= 4.0;
            }
            if (p1.grid == null || p2.grid == null) return false;

            int totalCells = p1.grid.length;
            int sameCells = 0;
            int intersection = 0;
            int union = 0;
            for (int i = 0; i < totalCells; i++) {
                boolean b1 = p1.grid[i];
                boolean b2 = p2.grid[i];
                if (b1 == b2) sameCells++;
                if (b1 && b2) intersection++;
                if (b1 || b2) union++;
            }
            if (union == 0) return false;
            double hammingSimilarity = (double) sameCells / totalCells;
            double jaccardSimilarity = (double) intersection / union;
            return hammingSimilarity >= 0.90 && jaccardSimilarity >= 0.75;
        } catch (Exception e) {
            return false;
        }
    }

    private static class InkSignatureProfile {
        final boolean[] grid;
        final int[] rgbaFallback;
        final double aspectRatio;

        InkSignatureProfile(boolean[] grid, int[] rgbaFallback, double aspectRatio) {
            this.grid = grid;
            this.rgbaFallback = rgbaFallback;
            this.aspectRatio = aspectRatio;
        }
    }

    private static InkSignatureProfile extractInkProfile(String dataUrlOrBase64) {
        try {
            String raw = dataUrlOrBase64.contains(",") ? dataUrlOrBase64.split(",")[1].trim() : dataUrlOrBase64.trim();
            byte[] imageBytes = Base64.getDecoder().decode(raw);
            BufferedImage img = ImageIO.read(new ByteArrayInputStream(imageBytes));
            if (img == null) return null;

            int width = img.getWidth();
            int height = img.getHeight();
            if (width <= 0 || height <= 0) return null;

            int cornerPixels = 0;
            long totalBrightness = 0;
            int transparentCornerCount = 0;
            for (int y = 0; y < Math.min(20, height); y++) {
                for (int x = 0; x < Math.min(20, width); x++) {
                    int rgb = img.getRGB(x, y);
                    int a = (rgb >> 24) & 0xFF;
                    if (a < 50) {
                        transparentCornerCount++;
                    } else {
                        int r = (rgb >> 16) & 0xFF;
                        int g = (rgb >> 8) & 0xFF;
                        int b = rgb & 0xFF;
                        totalBrightness += (int) (0.299 * r + 0.587 * g + 0.114 * b);
                        cornerPixels++;
                    }
                }
            }
            boolean hasTransparency = transparentCornerCount > 5;
            double bgBrightness = cornerPixels > 0 ? (double) totalBrightness / cornerPixels : 230.0;
            double paperThreshold = hasTransparency ? 225.0 : Math.max(80.0, bgBrightness - 15.0);

            boolean[][] inkMask = new boolean[height][width];
            int minX = width, minY = height, maxX = -1, maxY = -1;
            int totalInkPixels = 0;

            for (int y = 0; y < height; y++) {
                for (int x = 0; x < width; x++) {
                    int rgb = img.getRGB(x, y);
                    int a = (rgb >> 24) & 0xFF;
                    if (a < 45) continue;
                    int r = (rgb >> 16) & 0xFF;
                    int g = (rgb >> 8) & 0xFF;
                    int b = rgb & 0xFF;
                    double lum = 0.299 * r + 0.587 * g + 0.114 * b;
                    if (lum < paperThreshold) {
                        inkMask[y][x] = true;
                        totalInkPixels++;
                        if (x < minX) minX = x;
                        if (y < minY) minY = y;
                        if (x > maxX) maxX = x;
                        if (y > maxY) maxY = y;
                    }
                }
            }

            if (totalInkPixels < 10 || maxX <= minX || maxY <= minY) {
                int[] rgba = new int[16 * 16 * 4];
                int idx = 0;
                for (int gy = 0; gy < 16; gy++) {
                    int sy = Math.min(height - 1, (gy * height) / 16);
                    for (int gx = 0; gx < 16; gx++) {
                        int sx = Math.min(width - 1, (gx * width) / 16);
                        int pixel = img.getRGB(sx, sy);
                        rgba[idx++] = (pixel >> 16) & 0xFF;
                        rgba[idx++] = (pixel >> 8) & 0xFF;
                        rgba[idx++] = pixel & 0xFF;
                        rgba[idx++] = (pixel >> 24) & 0xFF;
                    }
                }
                return new InkSignatureProfile(null, rgba, (double) width / height);
            }

            int boxW = maxX - minX + 1;
            int boxH = maxY - minY + 1;
            int gridW = 32;
            int gridH = 16;
            boolean[] grid = new boolean[gridW * gridH];

            for (int gy = 0; gy < gridH; gy++) {
                int y0 = minY + (gy * boxH) / gridH;
                int y1 = Math.max(y0 + 1, minY + ((gy + 1) * boxH) / gridH);
                for (int gx = 0; gx < gridW; gx++) {
                    int x0 = minX + (gx * boxW) / gridW;
                    int x1 = Math.max(x0 + 1, minX + ((gx + 1) * boxW) / gridW);
                    int inkCount = 0;
                    int cellArea = 0;
                    for (int y = y0; y < Math.min(height, y1); y++) {
                        for (int x = x0; x < Math.min(width, x1); x++) {
                            cellArea++;
                            if (inkMask[y][x]) inkCount++;
                        }
                    }
                    grid[gy * gridW + gx] = cellArea > 0 && ((double) inkCount / cellArea) >= 0.05;
                }
            }

            return new InkSignatureProfile(grid, null, (double) boxW / boxH);
        } catch (Exception e) {
            return null;
        }
    }
}
