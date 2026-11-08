package vn.edu.drl.backend.service.impl;

import vn.edu.drl.backend.service.*;

import vn.edu.drl.backend.service.CriteriaService;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
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

@Service
@RequiredArgsConstructor
public class CriteriaServiceImpl implements CriteriaService {
    private final CriteriaRepository criteriaRepository;
    private final SemesterRepository semesterRepository;
    private final FieldMasterRepository fieldMasterRepository;

    public List<CriteriaResponse> getCriteriaBySemester(Long semesterId) {
        return criteriaRepository.findBySemesterId(semesterId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public CriteriaResponse getCriteriaById(Long id) {
        Criteria criteria = criteriaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Criteria not found"));
        return mapToResponse(criteria);
    }

    @Transactional
    public CriteriaResponse createCriteria(CriteriaRequest request) {
        Semester semester = semesterRepository.findById(request.getSemesterId())
                .orElseThrow(() -> new RuntimeException("Semester not found"));
        FieldMaster fieldMaster = fieldMasterRepository.findById(request.getFieldId())
                .orElseThrow(() -> new RuntimeException("Field Master not found"));

        if (Boolean.FALSE.equals(fieldMaster.getIsActive())) {
            throw new RuntimeException("Cannot use inactive FieldMaster");
        }

        Criteria criteria = new Criteria();
        criteria.setSemester(semester);
        criteria.setFieldMaster(fieldMaster);
        mapToEntity(request, criteria);

        Criteria saved = criteriaRepository.save(criteria);
        return mapToResponse(saved);
    }

    @Transactional
    public CriteriaResponse updateCriteria(Long id, CriteriaRequest request) {
        Criteria criteria = criteriaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Criteria not found"));

        if (!criteria.getSemester().getId().equals(request.getSemesterId())) {
            Semester semester = semesterRepository.findById(request.getSemesterId())
                    .orElseThrow(() -> new RuntimeException("Semester not found"));
            criteria.setSemester(semester);
        }

        if (!criteria.getFieldMaster().getId().equals(request.getFieldId())) {
            FieldMaster fieldMaster = fieldMasterRepository.findById(request.getFieldId())
                    .orElseThrow(() -> new RuntimeException("Field Master not found"));
            if (Boolean.FALSE.equals(fieldMaster.getIsActive())) {
                throw new RuntimeException("Cannot use inactive FieldMaster");
            }
            criteria.setFieldMaster(fieldMaster);
        }

        mapToEntity(request, criteria);
        Criteria updated = criteriaRepository.save(criteria);
        return mapToResponse(updated);
    }

    @Transactional
    public void deleteCriteria(Long id) {
        criteriaRepository.deleteById(id);
    }

    private void mapToEntity(CriteriaRequest request, Criteria criteria) {
        criteria.setCriteriaCode(request.getCriteriaCode());
        criteria.setTitle(request.getTitle());
        criteria.setCategory(request.getCategory());
        criteria.setMaxScore(request.getMaxScore());
        criteria.setRequiresProof(request.getRequiresProof());
        criteria.setOrderIndex(request.getOrderIndex());
    }

    private CriteriaResponse mapToResponse(Criteria criteria) {
        CriteriaResponse response = new CriteriaResponse();
        response.setId(criteria.getId());
        response.setSemesterId(criteria.getSemester().getId());
        response.setFieldId(criteria.getFieldMaster().getId());
        response.setCriteriaCode(criteria.getCriteriaCode());
        response.setTitle(criteria.getTitle());
        response.setCategory(criteria.getCategory());
        response.setMaxScore(criteria.getMaxScore());
        response.setRequiresProof(criteria.getRequiresProof());
        response.setOrderIndex(criteria.getOrderIndex());
        return response;
    }
}
