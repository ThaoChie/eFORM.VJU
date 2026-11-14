package vn.edu.drl.backend.service;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.interactive.digitalsignature.PDSignature;
import org.junit.jupiter.api.Test;
import vn.edu.drl.backend.service.engine.PadesSignatureEngine;

import java.io.ByteArrayOutputStream;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

public class PadesSignatureEngineTest {

    @Test
    public void testPadesSigningProducesValidSignatureDictionary() throws Exception {
        // 1. Generate clean minimal PDF in memory
        byte[] originalPdf;
        try (PDDocument doc = new PDDocument()) {
            doc.addPage(new PDPage());
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            doc.save(baos);
            originalPdf = baos.toByteArray();
        }

        // 2. Initialize PadesSignatureEngine
        PadesSignatureEngine engine = new PadesSignatureEngine();
        engine.init();

        // 3. Sign the PDF
        byte[] signedPdf = engine.signPdf(
                originalPdf,
                "Xác nhận Bảng Điểm Rèn Luyện Sinh Viên",
                "Hà Nội, Việt Nam",
                "Trường Đại học Việt Nhật (VJU) - ĐHQGHN"
        );

        assertNotNull(signedPdf);
        assertTrue(signedPdf.length > originalPdf.length);

        // 4. Verify PAdES / PKCS#7 signature dictionary using PDFBox
        try (PDDocument signedDoc = Loader.loadPDF(signedPdf)) {
            List<PDSignature> signatures = signedDoc.getSignatureDictionaries();
            assertEquals(1, signatures.size(), "Should have exactly 1 digital signature dictionary");

            PDSignature sig = signedDoc.getLastSignatureDictionary();
            assertNotNull(sig);
            assertEquals("Adobe.PPKLite", sig.getFilter());
            assertEquals("adbe.pkcs7.detached", sig.getSubFilter());
            assertTrue(sig.getName().contains("Đại học Việt Nhật"));
            assertEquals("Xác nhận Bảng Điểm Rèn Luyện Sinh Viên", sig.getReason());
            assertEquals("Hà Nội, Việt Nam", sig.getLocation());

            int[] byteRange = sig.getByteRange();
            assertNotNull(byteRange);
            assertEquals(4, byteRange.length);
            assertTrue(byteRange[0] == 0);
            assertTrue(byteRange[1] > 0);
            assertTrue(byteRange[2] > byteRange[1]);
            assertTrue(byteRange[3] > 0);
        }
    }
}
