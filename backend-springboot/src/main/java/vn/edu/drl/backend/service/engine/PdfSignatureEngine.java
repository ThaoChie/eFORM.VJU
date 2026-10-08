package vn.edu.drl.backend.service.engine;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;

import org.apache.pdfbox.Loader;

@Service
public class PdfSignatureEngine {

    public byte[] insertSignatureImage(byte[] pdfBytes, byte[] imageBytes, float x, float y) {
        try (PDDocument document = Loader.loadPDF(pdfBytes)) {
            PDPage page = document.getPage(document.getNumberOfPages() - 1);
            
            PDImageXObject pdImage = PDImageXObject.createFromByteArray(document, imageBytes, "signature");

            try (PDPageContentStream contentStream = new PDPageContentStream(document, page, PDPageContentStream.AppendMode.APPEND, true, true)) {
                contentStream.drawImage(pdImage, x, y, 100, 50); // Scale down to fit slot
            }

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            document.save(baos);
            return baos.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to insert signature image: " + e.getMessage());
        }
    }
}
