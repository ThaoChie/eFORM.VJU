package vn.edu.drl.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import vn.edu.drl.backend.dao.CriteriaRepository;
import vn.edu.drl.backend.dao.FieldMasterRepository;
import vn.edu.drl.backend.dao.FormVersionRepository;
import vn.edu.drl.backend.dao.SemesterRepository;
import vn.edu.drl.backend.dto.request.FormTemplateRequest;
import vn.edu.drl.backend.dto.response.FormVersionResponse;
import vn.edu.drl.backend.enu.FormVersionStatus;
import vn.edu.drl.backend.model.Criteria;
import vn.edu.drl.backend.model.FieldMaster;
import vn.edu.drl.backend.model.FormVersion;
import vn.edu.drl.backend.model.Semester;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;


public interface FormVersionService {
    List<FormVersionResponse> getTemplates();
    FormVersionResponse getTemplateById(Long id);
    FormVersionResponse createTemplate(FormTemplateRequest request);
    FormVersionResponse updateTemplate(Long id, FormTemplateRequest request);
    FormVersionResponse activateTemplate(Long id);
}
