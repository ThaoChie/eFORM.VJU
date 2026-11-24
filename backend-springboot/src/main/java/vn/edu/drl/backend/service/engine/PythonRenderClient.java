package vn.edu.drl.backend.service.engine;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Service
public class PythonRenderClient {

    private final RestTemplate restTemplate;
    private final String renderUrl;

    public PythonRenderClient(
            RestTemplate restTemplate,
            @Value("${python.parser.url:http://localhost:8000/render}") String renderUrl) {
        this.restTemplate = restTemplate;
        this.renderUrl = renderUrl;
    }

    public byte[] renderPdf(Map<String, Object> data) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(data, headers);

        try {
            ResponseEntity<byte[]> response = restTemplate.postForEntity(renderUrl, request, byte[].class);
            if (response.getBody() != null) {
                return response.getBody();
            }
        } catch (Exception e) {
            System.err.println("Python render service unavailable: " + e.getMessage() + ". Using fallback PDF template.");
        }
        String stream = "BT /F1 12 Tf 80 160 Td ([[SIG_STUDENT]]) Tj 160 0 Td ([[SIG_CLASS]]) Tj 160 0 Td ([[SIG_DEAN]]) Tj ET";
        return ("%PDF-1.4\n" +
                "1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n" +
                "2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n" +
                "3 0 obj<</Type/Page/MediaBox[0 0 595 842]/Parent 2 0 R/Resources<< /Font << /F1 4 0 R >> >>/Contents 5 0 R>>endobj\n" +
                "4 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\n" +
                "5 0 obj<</Length " + stream.length() + ">>stream\n" + stream + "\nendstream\nendobj\n" +
                "xref\n0 6\n0000000000 65535 f \n" +
                "trailer<</Size 6/Root 1 0 R>>\nstartxref\n450\n%%EOF\n").getBytes(java.nio.charset.StandardCharsets.ISO_8859_1);
    }
}
