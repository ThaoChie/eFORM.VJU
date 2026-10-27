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
        return ("%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n" +
                "3 0 obj<</Type/Page/MediaBox[0 0 595 842]/Parent 2 0 R/Resources<<>>>>endobj\n" +
                "xref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000052 00000 n \n0000000101 00000 n \n" +
                "trailer<</Size 4/Root 1 0 R>>\nstartxref\n178\n%%EOF\n").getBytes(java.nio.charset.StandardCharsets.ISO_8859_1);
    }
}
