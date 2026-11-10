package vn.edu.drl.backend.service.impl;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import vn.edu.drl.backend.dao.DepartmentRepository;
import vn.edu.drl.backend.dao.MajorRepository;
import vn.edu.drl.backend.dto.request.MajorRequest;
import vn.edu.drl.backend.dto.response.MajorResponse;
import vn.edu.drl.backend.exception.BusinessException;
import vn.edu.drl.backend.model.Department;
import vn.edu.drl.backend.model.Major;
import vn.edu.drl.backend.service.MajorService;

import java.io.InputStream;
import java.util.*;
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
        return majorRepository.findAll(org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.ASC, "id")).stream()
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

        // Mã ngành là duy nhất và cố định, không cho phép chỉnh sửa
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

    @Override
    public byte[] generateExcelTemplate() {
        try (Workbook workbook = new XSSFWorkbook(); java.io.ByteArrayOutputStream out = new java.io.ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Nganh");
            Row header = sheet.createRow(0);
            header.createCell(0).setCellValue("Mã Ngành *");
            header.createCell(1).setCellValue("Tên Ngành *");
            header.createCell(2).setCellValue("Mã Khoa *");
            header.createCell(3).setCellValue("Trạng thái (1=Hoạt động, 0=Vô hiệu hóa)");

            Row sample1 = sheet.createRow(1);
            sample1.createCell(0).setCellValue("BCSE");
            sample1.createCell(1).setCellValue("Khoa học và Kỹ thuật Máy tính");
            sample1.createCell(2).setCellValue("CNTT");
            sample1.createCell(3).setCellValue("1");

            Row sample2 = sheet.createRow(2);
            sample2.createCell(0).setCellValue("BBA");
            sample2.createCell(1).setCellValue("Quản trị Kinh doanh");
            sample2.createCell(2).setCellValue("KT");
            sample2.createCell(3).setCellValue("1");

            workbook.write(out);
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Lỗi tạo template Excel: " + e.getMessage());
        }
    }

    @Override
    @Transactional
    public Map<String, Object> importFromExcel(MultipartFile file, boolean preview) {
        Map<String, Object> result = new HashMap<>();
        List<String> errors = new ArrayList<>();
        int validRows = 0;
        int invalidRows = 0;

        List<Major> listToSave = new ArrayList<>();
        DataFormatter formatter = new DataFormatter();
        Set<String> seenCodes = new HashSet<>();

        try (InputStream is = file.getInputStream(); Workbook workbook = WorkbookFactory.create(is)) {
            Sheet sheet = workbook.getSheetAt(0);

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (isRowEmpty(row, formatter)) continue;

                try {
                    String code = getCellString(formatter, row.getCell(0));
                    String name = getCellString(formatter, row.getCell(1));
                    String deptCode = getCellString(formatter, row.getCell(2));
                    String statusStr = row.getLastCellNum() > 3 ? getCellString(formatter, row.getCell(3)) : "";

                    if (code.isEmpty()) {
                        errors.add("Dòng " + (i + 1) + ": Mã Ngành không được để trống");
                        invalidRows++;
                        continue;
                    }
                    if (name.isEmpty()) {
                        errors.add("Dòng " + (i + 1) + ": Tên Ngành không được để trống");
                        invalidRows++;
                        continue;
                    }
                    if (deptCode.isEmpty()) {
                        errors.add("Dòng " + (i + 1) + ": Mã Khoa trực thuộc không được để trống");
                        invalidRows++;
                        continue;
                    }
                    if (code.length() > 50) {
                        errors.add("Dòng " + (i + 1) + ": Mã Ngành không được vượt quá 50 ký tự");
                        invalidRows++;
                        continue;
                    }
                    if (seenCodes.contains(code.toLowerCase())) {
                        errors.add("Dòng " + (i + 1) + ": Mã Ngành '" + code + "' bị trùng lặp trong file tải lên");
                        invalidRows++;
                        continue;
                    }
                    if (majorRepository.existsByMajorCode(code)) {
                        errors.add("Dòng " + (i + 1) + ": Mã Ngành '" + code + "' đã tồn tại trong hệ thống");
                        invalidRows++;
                        continue;
                    }

                    var deptOpt = departmentRepository.findByDeptCode(deptCode);
                    if (deptOpt.isEmpty()) {
                        errors.add("Dòng " + (i + 1) + ": Mã Khoa '" + deptCode + "' không tồn tại trong hệ thống");
                        invalidRows++;
                        continue;
                    }

                    seenCodes.add(code.toLowerCase());

                    Major m = new Major();
                    m.setMajorCode(code);
                    m.setMajorName(name);
                    m.setDepartment(deptOpt.get());
                    m.setStatus("0".equals(statusStr) || "Vô hiệu hóa".equalsIgnoreCase(statusStr) ? 0 : 1);
                    listToSave.add(m);
                    validRows++;
                } catch (Exception ex) {
                    errors.add("Dòng " + (i + 1) + ": Lỗi định dạng - " + ex.getMessage());
                    invalidRows++;
                }
            }
        } catch (Exception e) {
            throw new RuntimeException("Lỗi đọc file Excel: " + e.getMessage(), e);
        }

        if (!preview && !listToSave.isEmpty()) {
            majorRepository.saveAll(listToSave);
        }

        result.put("validRows", validRows);
        result.put("invalidRows", invalidRows);
        result.put("errors", errors);
        return result;
    }

    private boolean isRowEmpty(Row row, DataFormatter formatter) {
        if (row == null) return true;
        for (int c = row.getFirstCellNum(); c < row.getLastCellNum(); c++) {
            Cell cell = row.getCell(c);
            if (cell != null && cell.getCellType() != CellType.BLANK) {
                String val = formatter.formatCellValue(cell).trim();
                if (!val.isEmpty()) return false;
            }
        }
        return true;
    }

    private String getCellString(DataFormatter formatter, Cell cell) {
        if (cell == null) return "";
        return formatter.formatCellValue(cell).trim();
    }
}
