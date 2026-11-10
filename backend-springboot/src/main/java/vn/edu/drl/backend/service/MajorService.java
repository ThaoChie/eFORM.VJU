package vn.edu.drl.backend.service;

import vn.edu.drl.backend.dto.request.MajorRequest;
import vn.edu.drl.backend.dto.response.MajorResponse;
import java.util.List;

public interface MajorService {
    List<MajorResponse> findAll();
    MajorResponse findById(Long id);
    MajorResponse create(MajorRequest req);
    MajorResponse update(Long id, MajorRequest req);
    MajorResponse toggleStatus(Long id);
}
