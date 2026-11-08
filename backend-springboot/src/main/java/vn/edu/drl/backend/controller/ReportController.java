package vn.edu.drl.backend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import vn.edu.drl.backend.Wrapper.ApiResponse;
import vn.edu.drl.backend.Wrapper.PageWrapper;
import vn.edu.drl.backend.dto.response.WorkflowQueueItemResponse;
import vn.edu.drl.backend.service.ReportService;

import java.io.ByteArrayInputStream;

@RestController
@RequestMapping("/api/v1/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/aggregate")
    @PreAuthorize("hasAnyRole('ADMIN', 'DEAN')")
    public ApiResponse<PageWrapper<WorkflowQueueItemResponse>> getAggregate(
            @RequestParam(required = false) String studentCode,
            @RequestParam(required = false) Long classId,
            @RequestParam(required = false) Long deptId,
            @RequestParam(required = false) String academicCohort,
            @RequestParam(required = false) Long semesterId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        return ApiResponse.success(new PageWrapper<>(reportService.getAggregate(
                studentCode, classId, deptId, academicCohort, semesterId, page, size)));
    }

    @GetMapping("/export-excel")
    @PreAuthorize("hasAnyRole('ADMIN', 'DEAN')")
    public ResponseEntity<InputStreamResource> exportExcel(
            @RequestParam(required = false) String studentCode,
            @RequestParam(required = false) Long classId,
            @RequestParam(required = false) Long deptId,
            @RequestParam(required = false) String academicCohort,
            @RequestParam(required = false) Long semesterId) {

        ByteArrayInputStream in = reportService.exportExcel(studentCode, classId, deptId, academicCohort, semesterId);

        HttpHeaders headers = new HttpHeaders();
        headers.add("Content-Disposition", "attachment; filename=report.xlsx");

        return ResponseEntity
                .ok()
                .headers(headers)
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(new InputStreamResource(in));
    }

    @GetMapping("/forms/{id}/proofs")
    public ResponseEntity<InputStreamResource> exportProofsZip(@PathVariable Long id) {
        InputStreamResource in = reportService.exportProofsZip(id);
        HttpHeaders headers = new HttpHeaders();
        headers.add("Content-Disposition", "attachment; filename=proofs_" + id + ".zip");
        return ResponseEntity
                .ok()
                .headers(headers)
                .contentType(MediaType.parseMediaType("application/zip"))
                .body(in);
    }

    @GetMapping("/forms/{id}/pdf")
    public ApiResponse<String> getSignedPdfUrl(@PathVariable Long id) {
        return ApiResponse.success(reportService.getSignedPdfUrl(id));
    }
}
