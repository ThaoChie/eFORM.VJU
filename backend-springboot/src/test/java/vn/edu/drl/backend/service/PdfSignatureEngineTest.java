package vn.edu.drl.backend.service;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.junit.jupiter.api.Test;
import vn.edu.drl.backend.service.engine.PdfSignatureEngine;

import javax.imageio.ImageIO;
import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;

import static org.junit.jupiter.api.Assertions.*;

public class PdfSignatureEngineTest {

    private byte[] createDummySignatureImage() throws Exception {
        BufferedImage image = new BufferedImage(100, 50, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g = image.createGraphics();
        g.setColor(new Color(29, 78, 216));
        g.drawString("Chữ ký mẫu", 10, 25);
        g.dispose();

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(image, "png", baos);
        return baos.toByteArray();
    }

    @Test
    public void testDynamicMarkerSignatureInsertion() throws Exception {
        PdfSignatureEngine engine = new PdfSignatureEngine();
        byte[] sigImage = createDummySignatureImage();

        // 1. Create a 3-page PDF with markers on page 3 (index 2)
        byte[] originalPdf;
        try (PDDocument doc = new PDDocument()) {
            doc.addPage(new PDPage()); // Page 1
            doc.addPage(new PDPage()); // Page 2

            PDPage page3 = new PDPage(); // Page 3 (where signature section shifted)
            doc.addPage(page3);

            try (PDPageContentStream cs = new PDPageContentStream(doc, page3)) {
                cs.beginText();
                cs.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 10);
                cs.newLineAtOffset(80, 200);
                cs.showText("[[SIG_STUDENT]]");
                cs.newLineAtOffset(180, 0);
                cs.showText("[[SIG_CLASS]]");
                cs.newLineAtOffset(180, 0);
                cs.showText("[[SIG_DEAN]]");
                cs.endText();
            }

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            doc.save(baos);
            originalPdf = baos.toByteArray();
        }

        // 2. Insert Student signature using marker
        byte[] pdfWithStudent = engine.insertSignatureByMarker(
                originalPdf,
                sigImage,
                "[[SIG_STUDENT]]",
                new String[]{"{{ sig_student_image }}"},
                100, 100
        );
        assertNotNull(pdfWithStudent);
        assertTrue(pdfWithStudent.length > originalPdf.length);

        // 3. Insert Class Leader signature using marker
        byte[] pdfWithLeader = engine.insertSignatureByMarker(
                pdfWithStudent,
                sigImage,
                "[[SIG_CLASS]]",
                new String[]{"[[SIG_LEADER]]"},
                300, 100
        );
        assertNotNull(pdfWithLeader);

        // 4. Insert Dean signature using marker
        byte[] finalPdf = engine.insertSignatureByMarker(
                pdfWithLeader,
                sigImage,
                "[[SIG_DEAN]]",
                new String[]{"[[SIG_FACULTY]]"},
                500, 100
        );
        assertNotNull(finalPdf);

        // 5. Verify PDF structure using PDFBox
        try (PDDocument doc = Loader.loadPDF(finalPdf)) {
            assertEquals(3, doc.getNumberOfPages(), "PDF should have 3 pages");
            PDPage page3 = doc.getPage(2);
            assertNotNull(page3.getResources());
            // Page 3 should contain images
            assertTrue(page3.getResources().getXObjectNames().iterator().hasNext(),
                    "Page 3 should contain signature XObjects placed dynamically by markers");
        }
    }

    @Test
    public void testFallbackWhenMarkerNotFound() throws Exception {
        PdfSignatureEngine engine = new PdfSignatureEngine();
        byte[] sigImage = createDummySignatureImage();

        byte[] plainPdf;
        try (PDDocument doc = new PDDocument()) {
            doc.addPage(new PDPage());
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            doc.save(baos);
            plainPdf = baos.toByteArray();
        }

        // Search for non-existent marker, should smoothly fallback
        byte[] signedPdf = engine.insertSignatureByMarker(
                plainPdf,
                sigImage,
                "[[NON_EXISTENT_MARKER]]",
                null,
                150, 120
        );

        assertNotNull(signedPdf);
        try (PDDocument doc = Loader.loadPDF(signedPdf)) {
            assertEquals(1, doc.getNumberOfPages());
            PDPage page = doc.getPage(0);
            assertTrue(page.getResources().getXObjectNames().iterator().hasNext(),
                    "Fallback should insert signature on last page");
        }
    }
}
