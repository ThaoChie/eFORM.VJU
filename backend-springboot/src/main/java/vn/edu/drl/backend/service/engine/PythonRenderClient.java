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
            return response.getBody();
        } catch (Exception e) {
            throw new RuntimeException("RENDER_SERVICE_ERROR: Failed to call Python render service: " + e.getMessage());
        }
    }
}
