package vn.edu.drl.backend.service.impl;

import vn.edu.drl.backend.service.*;

import vn.edu.drl.backend.service.SemesterService;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.drl.backend.dao.SemesterRepository;
import vn.edu.drl.backend.dto.request.SemesterRequest;
import vn.edu.drl.backend.dto.response.SemesterResponse;
import vn.edu.drl.backend.model.Semester;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SemesterServiceImpl implements SemesterService {
    private final SemesterRepository semesterRepository;

    public List<SemesterResponse> getAllSemesters() {
        return semesterRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public SemesterResponse getSemesterById(Long id) {
        Semester semester = semesterRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Semester not found"));
        return mapToResponse(semester);
    }

    @Transactional
    public SemesterResponse createSemester(SemesterRequest request) {
        if (semesterRepository.existsBySemesterCode(request.getSemesterCode())) {
            throw new RuntimeException("Semester code already exists");
        }

        if (Boolean.TRUE.equals(request.getIsActive())) {
            deactivateCurrentActiveSemester();
        }

        Semester semester = new Semester();
        mapToEntity(request, semester);
        
        Semester saved = semesterRepository.save(semester);
        return mapToResponse(saved);
    }

    @Transactional
    public SemesterResponse updateSemester(Long id, SemesterRequest request) {
        Semester semester = semesterRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Semester not found"));

        if (!semester.getSemesterCode().equals(request.getSemesterCode()) && 
            semesterRepository.existsBySemesterCode(request.getSemesterCode())) {
            throw new RuntimeException("Semester code already exists");
        }

        if (Boolean.TRUE.equals(request.getIsActive()) && !Boolean.TRUE.equals(semester.getIsActive())) {
            deactivateCurrentActiveSemester();
        }

        mapToEntity(request, semester);
        
        Semester updated = semesterRepository.save(semester);
        return mapToResponse(updated);
    }

    @Transactional
    public void deleteSemester(Long id) {
        semesterRepository.deleteById(id);
    }

    private void deactivateCurrentActiveSemester() {
        semesterRepository.findByIsActiveTrue().ifPresent(activeSemester -> {
            activeSemester.setIsActive(false);
            semesterRepository.save(activeSemester);
        });
    }

    private void mapToEntity(SemesterRequest request, Semester semester) {
        semester.setSemesterCode(request.getSemesterCode());
        semester.setSemesterName(request.getSemesterName());
        semester.setAcademicYear(request.getAcademicYear());
        semester.setIsActive(request.getIsActive());
        semester.setStartDate(request.getStartDate());
        semester.setEndDate(request.getEndDate());
    }

    private SemesterResponse mapToResponse(Semester semester) {
        SemesterResponse response = new SemesterResponse();
        response.setId(semester.getId());
        response.setSemesterCode(semester.getSemesterCode());
        response.setSemesterName(semester.getSemesterName());
        response.setAcademicYear(semester.getAcademicYear());
        response.setIsActive(semester.getIsActive());
        response.setStartDate(semester.getStartDate());
        response.setEndDate(semester.getEndDate());
        return response;
    }
}
