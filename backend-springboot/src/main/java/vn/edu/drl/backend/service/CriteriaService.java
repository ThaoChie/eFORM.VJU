package vn.edu.drl.backend.service;

import vn.edu.drl.backend.dao.CriteriaRepository;
import vn.edu.drl.backend.dao.FieldMasterRepository;
import vn.edu.drl.backend.dao.SemesterRepository;
import vn.edu.drl.backend.dto.request.CriteriaRequest;
import vn.edu.drl.backend.dto.response.CriteriaResponse;
import vn.edu.drl.backend.model.Criteria;
import vn.edu.drl.backend.model.FieldMaster;
import vn.edu.drl.backend.model.Semester;

import java.util.List;
import java.util.stream.Collectors;


public interface CriteriaService {
    List<CriteriaResponse> getCriteriaBySemester(Long semesterId);
    CriteriaResponse getCriteriaById(Long id);
    CriteriaResponse createCriteria(CriteriaRequest request);
    CriteriaResponse updateCriteria(Long id, CriteriaRequest request);
    void deleteCriteria(Long id);
}
