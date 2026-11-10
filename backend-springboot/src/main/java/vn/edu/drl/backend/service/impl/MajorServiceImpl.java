package vn.edu.drl.backend.service.impl;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.drl.backend.dao.DepartmentRepository;
import vn.edu.drl.backend.dao.MajorRepository;
import vn.edu.drl.backend.dto.request.MajorRequest;
import vn.edu.drl.backend.dto.response.MajorResponse;
import vn.edu.drl.backend.exception.BusinessException;
import vn.edu.drl.backend.model.Department;
import vn.edu.drl.backend.model.Major;
import vn.edu.drl.backend.service.MajorService;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class MajorServiceImpl implements MajorService {

    private final MajorRepository majorRepository;
    private final DepartmentRepository departmentRepository;

    public MajorServiceImpl(MajorRepository majorRepository, DepartmentRepository departmentRepository) {
        this.majorRepository = majorRepository;
        this.departmentRepository = departmentRepository;
    }

    @Override
    public List<MajorResponse> findAll() {
        return majorRepository.findAll().stream()
                .map(MajorResponse::new)
                .collect(Collectors.toList());
    }

    @Override
    public MajorResponse findById(Long id) {
        Major m = majorRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Không tìm thấy ngành"));
        return new MajorResponse(m);
    }

    @Override
    @Transactional
    public MajorResponse create(MajorRequest req) {
        String code = req.getMajorCode() != null ? req.getMajorCode().trim() : "";
        if (code.isEmpty()) {
            throw new BusinessException("Mã ngành không được để trống");
        }
        if (majorRepository.existsByMajorCode(code)) {
            throw new BusinessException("Mã ngành đã tồn tại");
        }

        Department dept = departmentRepository.findById(req.getDeptId())
                .orElseThrow(() -> new BusinessException("Khoa trực thuộc không tồn tại"));

        Major m = new Major();
        m.setMajorCode(code);
        m.setMajorName(req.getMajorName().trim());
        m.setDepartment(dept);
        m.setStatus(req.getStatus() != null ? req.getStatus() : 1);

        Major saved = majorRepository.save(m);
        return new MajorResponse(saved);
    }

    @Override
    @Transactional
    public MajorResponse update(Long id, MajorRequest req) {
        Major m = majorRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Không tìm thấy ngành"));

        if (req.getMajorName() != null && !req.getMajorName().trim().isEmpty()) {
            m.setMajorName(req.getMajorName().trim());
        }

        if (req.getDeptId() != null) {
            Department dept = departmentRepository.findById(req.getDeptId())
                    .orElseThrow(() -> new BusinessException("Khoa trực thuộc không tồn tại"));
            m.setDepartment(dept);
        }

        if (req.getStatus() != null) {
            m.setStatus(req.getStatus());
        }

        Major updated = majorRepository.save(m);
        return new MajorResponse(updated);
    }

    @Override
    @Transactional
    public MajorResponse toggleStatus(Long id) {
        Major m = majorRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Không tìm thấy ngành"));
        m.setStatus(m.getStatus() != null && m.getStatus() == 1 ? 0 : 1);
        Major updated = majorRepository.save(m);
        return new MajorResponse(updated);
    }
}
