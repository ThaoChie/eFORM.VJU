package vn.edu.drl.backend.service.engine;

import org.springframework.stereotype.Service;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

@Service
public class PdfHashEngine {

    public String hashPdf(byte[] pdfBytes) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(pdfBytes);
            StringBuilder hexString = new StringBuilder(2 * hashBytes.length);
            for (byte b : hashBytes) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("Failed to hash PDF: " + e.getMessage());
        }
    }
}
