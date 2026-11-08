package vn.edu.drl.backend.service;

import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.streaming.SXSSFWorkbook;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
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


public interface ReportService {
    Page<WorkflowQueueItemResponse> getAggregate(String studentCode, Long classId, Long deptId, String academicCohort, Long semesterId, int page, int size);
    ByteArrayInputStream exportExcel(String studentCode, Long classId, Long deptId, String academicCohort, Long semesterId);
    org.springframework.core.io.InputStreamResource exportProofsZip(Long formId);
    String getSignedPdfUrl(Long formId);
}
