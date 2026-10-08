package vn.edu.drl.backend.service.impl;

import vn.edu.drl.backend.service.*;

import vn.edu.drl.backend.service.ReportService;

import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.streaming.SXSSFWorkbook;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import vn.edu.drl.backend.dao.ScoreFormRepository;
import vn.edu.drl.backend.dao.UserRepository;
import vn.edu.drl.backend.dto.response.WorkflowQueueItemResponse;
import vn.edu.drl.backend.enu.Role;
import vn.edu.drl.backend.model.ScoreForm;
import vn.edu.drl.backend.model.User;
import vn.edu.drl.backend.security.SecurityUtils;

import jakarta.persistence.EntityManager;
import jakarta.persistence.TypedQuery;
import jakarta.persistence.criteria.*;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;
import vn.edu.drl.backend.model.ScoreFormDetail;
import org.springframework.core.io.InputStreamResource;

@Service
@RequiredArgsConstructor
public class ReportServiceImpl implements ReportService {

    private final EntityManager entityManager;
    private final UserRepository userRepository;
    private final ScoreFormRepository scoreFormRepository;
    private final vn.edu.drl.backend.dao.ScoreFormDetailRepository scoreFormDetailRepository;
    private final StorageService storageService;

    public Page<WorkflowQueueItemResponse> getAggregate(String studentCode, Long classId, Long deptId, String academicCohort, Long semesterId, int page, int size) {
        Long userId = SecurityUtils.getCurrentUserId();
        User currentUser = userRepository.findById(userId).orElseThrow();

        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<ScoreForm> cq = cb.createQuery(ScoreForm.class);
        Root<ScoreForm> root = cq.from(ScoreForm.class);
        
        List<Predicate> predicates = buildPredicates(cb, root, currentUser, studentCode, classId, deptId, academicCohort, semesterId);
        if (!predicates.isEmpty()) {
            cq.where(predicates.toArray(new Predicate[0]));
        }

        // Count query
        CriteriaQuery<Long> countCq = cb.createQuery(Long.class);
        Root<ScoreForm> countRoot = countCq.from(ScoreForm.class);
        List<Predicate> countPredicates = buildPredicates(cb, countRoot, currentUser, studentCode, classId, deptId, academicCohort, semesterId);
        countCq.select(cb.count(countRoot));
        if (!countPredicates.isEmpty()) {
            countCq.where(countPredicates.toArray(new Predicate[0]));
        }
        Long total = entityManager.createQuery(countCq).getSingleResult();

        TypedQuery<ScoreForm> query = entityManager.createQuery(cq);
        query.setFirstResult(page * size);
        query.setMaxResults(size);

        List<ScoreForm> results = query.getResultList();

        List<WorkflowQueueItemResponse> dtos = results.stream().map(f -> {
            WorkflowQueueItemResponse dto = new WorkflowQueueItemResponse();
            dto.setId(f.getId());
            dto.setStudentId(f.getStudent().getId());
            dto.setStudentCode(f.getStudent().getUserCode());
            dto.setStudentName(f.getStudent().getFullName());
            dto.setClassName(f.getStudent().getClassEntity() != null ? f.getStudent().getClassEntity().getClassName() : "");
            dto.setStatus(f.getStatus());
            dto.setStudentTotal(f.getStudentTotal());
            dto.setClassTotal(f.getClassTotal());
            dto.setSubmittedAt(f.getCreatedAt());
            return dto;
        }).collect(Collectors.toList());

        return new PageImpl<>(dtos, PageRequest.of(page, size), total);
    }

    public ByteArrayInputStream exportExcel(String studentCode, Long classId, Long deptId, String academicCohort, Long semesterId) {
        Long userId = SecurityUtils.getCurrentUserId();
        User currentUser = userRepository.findById(userId).orElseThrow();

        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<ScoreForm> cq = cb.createQuery(ScoreForm.class);
        Root<ScoreForm> root = cq.from(ScoreForm.class);
        
        List<Predicate> predicates = buildPredicates(cb, root, currentUser, studentCode, classId, deptId, academicCohort, semesterId);
        if (!predicates.isEmpty()) {
            cq.where(predicates.toArray(new Predicate[0]));
        }

        List<ScoreForm> forms = entityManager.createQuery(cq).getResultList();

        try (Workbook workbook = new SXSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Report");

            // Header
            Row headerRow = sheet.createRow(0);
            headerRow.createCell(0).setCellValue("STT");
            headerRow.createCell(1).setCellValue("Họ và tên");
            headerRow.createCell(2).setCellValue("Mã sinh viên");
            headerRow.createCell(3).setCellValue("Khóa");
            headerRow.createCell(4).setCellValue("Khoa");
            headerRow.createCell(5).setCellValue("Lớp");
            headerRow.createCell(6).setCellValue("Tổng điểm ĐRL");
            headerRow.createCell(7).setCellValue("Xếp loại");

            int rowIdx = 1;
            for (ScoreForm form : forms) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(rowIdx - 1);
                row.createCell(1).setCellValue(form.getStudent().getFullName());
                row.createCell(2).setCellValue(form.getStudent().getUserCode());
                row.createCell(3).setCellValue(form.getStudent().getAcademicCohort() != null ? form.getStudent().getAcademicCohort() : "");
                row.createCell(4).setCellValue(form.getStudent().getDepartment() != null ? form.getStudent().getDepartment().getDeptName() : "");
                row.createCell(5).setCellValue(form.getStudent().getClassEntity() != null ? form.getStudent().getClassEntity().getClassName() : "");
                row.createCell(6).setCellValue(form.getFinalTotal() != null ? form.getFinalTotal().doubleValue() : 0.0);
                row.createCell(7).setCellValue(form.getRanking() != null ? form.getRanking() : "");
            }

            workbook.write(out);
            return new ByteArrayInputStream(out.toByteArray());
        } catch (Exception e) {
            throw new RuntimeException("Failed to export excel data: " + e.getMessage());
        }
    }

    private List<Predicate> buildPredicates(CriteriaBuilder cb, Root<ScoreForm> root, User currentUser, String studentCode, Long classId, Long deptId, String academicCohort, Long semesterId) {
        List<Predicate> predicates = new ArrayList<>();
        
        // Scope restrictions
        if (currentUser.getRole() == Role.DEAN) {
            if (currentUser.getDepartment() == null) throw new RuntimeException("Dean has no department");
            predicates.add(cb.equal(root.get("student").get("department").get("id"), currentUser.getDepartment().getId()));
        } else if (currentUser.getRole() == Role.ADMIN) {
            if (deptId != null) {
                predicates.add(cb.equal(root.get("student").get("department").get("id"), deptId));
            }
        } else {
            throw new RuntimeException("403 Forbidden");
        }

        // Filters
        if (studentCode != null && !studentCode.isEmpty()) {
            predicates.add(cb.equal(root.get("student").get("userCode"), studentCode));
        }
        if (classId != null) {
            predicates.add(cb.equal(root.get("student").get("classEntity").get("id"), classId));
        }
        if (academicCohort != null && !academicCohort.isEmpty()) {
            predicates.add(cb.equal(root.get("student").get("academicCohort"), academicCohort));
        }
        if (semesterId != null) {
            predicates.add(cb.equal(root.get("semester").get("id"), semesterId));
        }

        return predicates;
    }

    public InputStreamResource exportProofsZip(Long formId) {
        List<ScoreFormDetail> details = scoreFormDetailRepository.findByScoreFormId(formId);
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        try (ZipOutputStream zos = new ZipOutputStream(baos)) {
            for (ScoreFormDetail detail : details) {
                if (detail.getProofUrl() != null && !detail.getProofUrl().isEmpty()) {
                    String url = detail.getProofUrl();
                    String fileName = url.substring(url.lastIndexOf('/') + 1);
                    
                    String extension = "";
                    int dotIndex = fileName.lastIndexOf('.');
                    if (dotIndex != -1) {
                        extension = fileName.substring(dotIndex);
                        fileName = fileName.substring(0, dotIndex);
                    } else {
                        extension = ".jpg"; // fallback extension
                    }
                    fileName = fileName + "_" + detail.getId() + extension;
                    
                    byte[] fileBytes;
                    try {
                        fileBytes = storageService.getFileBytes("proofs", url);
                    } catch (Exception e) {
                        fileBytes = new byte[0]; // fallback
                    }
                    if (fileBytes != null && fileBytes.length > 0) {
                        ZipEntry entry = new ZipEntry(fileName);
                        zos.putNextEntry(entry);
                        zos.write(fileBytes);
                        zos.closeEntry();
                    }
                }
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to zip proofs: " + e.getMessage());
        }
        return new InputStreamResource(new ByteArrayInputStream(baos.toByteArray()));
    }

    public String getSignedPdfUrl(Long formId) {
        ScoreForm form = scoreFormRepository.findById(formId).orElseThrow(() -> new RuntimeException("Form not found"));
        return form.getPdfFileUrl();
    }
}
