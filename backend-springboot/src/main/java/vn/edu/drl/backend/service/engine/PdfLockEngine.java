package vn.edu.drl.backend.service.engine;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.encryption.AccessPermission;
import org.apache.pdfbox.pdmodel.encryption.StandardProtectionPolicy;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.util.UUID;

import org.apache.pdfbox.Loader;

@Service
public class PdfLockEngine {

    public byte[] lockPdf(byte[] pdfBytes) {
        try (PDDocument document = Loader.loadPDF(pdfBytes)) {
            AccessPermission ap = new AccessPermission();
            ap.setCanModify(false);
            ap.setCanExtractContent(false);
            ap.setCanFillInForm(false);
            ap.setCanModifyAnnotations(false);

            // Using a random owner password so it cannot be easily unlocked
            String ownerPassword = UUID.randomUUID().toString();
            // Empty string for user password means it can be opened without password
            StandardProtectionPolicy spp = new StandardProtectionPolicy(ownerPassword, "", ap);
            spp.setEncryptionKeyLength(128);

            document.protect(spp);

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            document.save(baos);
            return baos.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to lock PDF: " + e.getMessage());
        }
    }
}
