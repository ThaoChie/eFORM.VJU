package vn.edu.drl.backend.service.engine;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.nio.file.Files;
import java.util.Base64;
import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;

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
        return removeBackground(converted);
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
            double paperThreshold = Math.max(185.0, bgBrightness - 10.0);
            double inkThreshold = Math.max(90.0, paperThreshold - 80.0);

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
        String cleanName = (name != null && !name.trim().isEmpty()) ? name.trim() : "Cán bộ lớp";
        String strokeHex = color != null ? String.format("#%02x%02x%02x", color.getRed(), color.getGreen(), color.getBlue()) : "#1d4ed8";
        String svg = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 280 85\" width=\"280\" height=\"85\">"
                + "<path d=\"M 20,55 Q 50,15 90,58 T 160,40 Q 200,12 245,55\" fill=\"none\" stroke=\"" + strokeHex + "\" stroke-width=\"2.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" opacity=\"0.85\"/>"
                + "<path d=\"M 35,68 Q 130,76 250,58\" fill=\"none\" stroke=\"" + strokeHex + "\" stroke-width=\"2\" stroke-linecap=\"round\"/>"
                + "<text x=\"50%\" y=\"46\" font-family=\"'Caveat', 'Dancing Script', 'Brush Script MT', cursive, sans-serif\" font-size=\"34\" font-weight=\"700\" fill=\"" + strokeHex + "\" text-anchor=\"middle\" font-style=\"italic\">"
                + cleanName
                + "</text></svg>";
        return "data:image/svg+xml;utf8," + java.net.URLEncoder.encode(svg, java.nio.charset.StandardCharsets.UTF_8).replace("+", "%20");
    }
}
