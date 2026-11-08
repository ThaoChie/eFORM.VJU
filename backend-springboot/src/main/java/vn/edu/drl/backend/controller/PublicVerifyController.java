package vn.edu.drl.backend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import vn.edu.drl.backend.Wrapper.ApiResponse;
import vn.edu.drl.backend.dto.response.PublicVerifyResponse;
import vn.edu.drl.backend.service.PublicVerifyService;

@RestController
@RequestMapping("/api/v1/public/verify")
@RequiredArgsConstructor
public class PublicVerifyController {

    private final PublicVerifyService verifyService;

    @GetMapping("/{scoreFormId}")
    public ApiResponse<PublicVerifyResponse> getVerifyInfo(@PathVariable Long scoreFormId) {
        return ApiResponse.success(verifyService.getVerifyInfo(scoreFormId));
    }

    @PostMapping("/{scoreFormId}/check")
    public ApiResponse<String> checkPdf(@PathVariable Long scoreFormId, @RequestParam("file") MultipartFile file) throws Exception {
        boolean match = verifyService.checkPdf(scoreFormId, file);
        return ApiResponse.success(match ? "Khớp" : "Không khớp");
    }
}
