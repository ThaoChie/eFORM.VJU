package vn.edu.drl.backend.service;

import vn.edu.drl.backend.dao.SemesterRepository;
import vn.edu.drl.backend.dto.request.SemesterRequest;
import vn.edu.drl.backend.dto.response.SemesterResponse;
import vn.edu.drl.backend.model.Semester;
import java.util.List;
import java.util.stream.Collectors;


public interface SemesterService {
    List<SemesterResponse> getAllSemesters();
    SemesterResponse getSemesterById(Long id);
    SemesterResponse createSemester(SemesterRequest request);
    SemesterResponse updateSemester(Long id, SemesterRequest request);
    void deleteSemester(Long id);
}
