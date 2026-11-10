package vn.edu.drl.backend.service;

import org.junit.jupiter.api.Test;
import vn.edu.drl.backend.service.engine.ImageConversionUtils;

import javax.imageio.ImageIO;
import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.util.Base64;

import static org.junit.jupiter.api.Assertions.*;

class ImageConversionUtilsTest {

    @Test
    void testRemoveBackgroundFromGrayPaper() throws Exception {
        // Tạo ảnh mô phỏng chữ ký chụp trên giấy có nền xám/bóng (RGB: 230, 235, 238)
        int width = 120;
        int height = 60;
        BufferedImage img = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = img.createGraphics();
        g.setColor(new Color(230, 235, 238));
        g.fillRect(0, 0, width, height);

        // Vẽ nét chữ ký mực xanh (RGB: 25, 60, 180)
        g.setColor(new Color(25, 60, 180));
        g.drawLine(30, 30, 90, 30);
        g.dispose();

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(img, "png", baos);
        String base64 = "data:image/png;base64," + Base64.getEncoder().encodeToString(baos.toByteArray());

        // Thực hiện tách nền
        String cleaned = ImageConversionUtils.removeBackground(base64);

        assertNotNull(cleaned);
        assertTrue(cleaned.startsWith("data:image/png;base64,"));

        byte[] cleanedBytes = Base64.getDecoder().decode(cleaned.substring("data:image/png;base64,".length()));
        BufferedImage resultImg = ImageIO.read(new ByteArrayInputStream(cleanedBytes));
        assertNotNull(resultImg);

        // Góc trên cùng (nền giấy) phải biến thành trong suốt (alpha = 0)
        int cornerAlpha = (resultImg.getRGB(0, 0) >> 24) & 0xFF;
        assertEquals(0, cornerAlpha, "Màu nền giấy phải được tách thành trong suốt hoàn toàn");
    }
}
