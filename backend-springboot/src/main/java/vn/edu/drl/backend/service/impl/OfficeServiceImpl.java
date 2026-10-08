package vn.edu.drl.backend.service.impl;

import vn.edu.drl.backend.service.OfficeService;
import org.springframework.stereotype.Service;
import vn.edu.drl.backend.dao.OfficeRepository;
import vn.edu.drl.backend.dao.UserRepository;
import vn.edu.drl.backend.model.Office;
import vn.edu.drl.backend.model.User;
import vn.edu.drl.backend.dto.request.OfficeRequest;
import vn.edu.drl.backend.dto.response.OfficeResponse;
import vn.edu.drl.backend.enu.Role;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.apache.poi.xssf.streaming.SXSSFWorkbook;

import org.springframework.web.multipart.MultipartFile;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class OfficeServiceImpl implements OfficeService {

    private final OfficeRepository repository;
    private final UserRepository userRepository;

    public OfficeServiceImpl(OfficeRepository repository, UserRepository userRepository) {
        this.repository = repository;
        this.userRepository = userRepository;
    }

    private OfficeResponse toResponse(Office o) {
        // Find ADMIN user linked to this office via positionTitle or just find ADMIN role users
        // For now we store headId in a separate mechanism - look for an ADMIN user whose
        // office association we track. Since the User model doesn't have an office FK yet,
        // we'll use a workaround: store head info in a separate in-memory map or add a column.
        // Simple approach: find ADMIN users with positionTitle matching office code
        String headName = "Chưa chỉ định";
        Long headId = null;
        // Try to find admin user by positionTitle = officeCode (convention)
        List<User> admins = userRepository.findAll().stream()
            .filter(u -> u.getRole() == Role.ADMIN && o.getOfficeCode().equals(u.getPositionTitle()))
            .collect(Collectors.toList());
        if (!admins.isEmpty()) {
            headName = admins.get(0).getFullName();
            headId = admins.get(0).getId();
        }
        return new OfficeResponse(o, headName, headId);
    }

    @Override
    public List<OfficeResponse> findAll() {
        return repository.findAll().stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public OfficeResponse create(OfficeRequest req) {
        if (req.getOfficeCode() == null || req.getOfficeCode().isBlank()) throw new RuntimeException("Mã phòng ban không được để trống");
        if (req.getOfficeName() == null || req.getOfficeName().isBlank()) throw new RuntimeException("Tên phòng ban không được để trống");
        if (repository.findByOfficeCode(req.getOfficeCode()).isPresent()) throw new RuntimeException("Mã phòng ban đã tồn tại");

        Office o = new Office();
        o.setOfficeCode(req.getOfficeCode());
        o.setOfficeName(req.getOfficeName());
        if (req.getStatus() != null) o.setStatus(req.getStatus());
        repository.save(o);

        if (req.getHeadId() != null) {
            assignHead(o, req.getHeadId());
        }

        return toResponse(o);
    }

    @Override
    public OfficeResponse update(Long id, OfficeRequest req) {
        Office o = repository.findById(id).orElseThrow(() -> new RuntimeException("Phòng ban không tồn tại"));
        if (req.getOfficeName() != null) o.setOfficeName(req.getOfficeName());
        if (req.getStatus() != null) o.setStatus(req.getStatus());
        repository.save(o);

        if (req.getHeadId() != null) {
            // Unset old head (remove positionTitle link)
            userRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.ADMIN && o.getOfficeCode().equals(u.getPositionTitle()))
                .forEach(u -> { u.setPositionTitle(null); userRepository.save(u); });
            assignHead(o, req.getHeadId());
        }

        return toResponse(o);
    }

    private void assignHead(Office o, Long headId) {
        User head = userRepository.findById(headId).orElse(null);
        if (head != null) {
            head.setPositionTitle(o.getOfficeCode());
            userRepository.save(head);
        }
    }

    @Override
    public Object toggleStatus(Long id) {
        Office o = repository.findById(id).orElseThrow(() -> new RuntimeException("Không tìm thấy phòng ban"));
        o.setStatus(o.getStatus() == 1 ? 0 : 1);
        return repository.save(o);
    }

    @Override
    public byte[] generateExcelTemplate() {
        try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Phong_ban");
            // Style header
            CellStyle headerStyle = workbook.createCellStyle();
            Font font = workbook.createFont();
            font.setBold(true);
            headerStyle.setFont(font);
            headerStyle.setFillForegroundColor(IndexedColors.LIGHT_BLUE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            Row header = sheet.createRow(0);
            String[] cols = {"Mã phòng ban (*)", "Tên phòng ban (*)", "Mã trưởng phòng (admin)", "Trạng thái (1=Hoạt động, 0=Vô hiệu)"};
            for (int i = 0; i < cols.length; i++) {
                Cell cell = header.createCell(i);
                cell.setCellValue(cols[i]);
                cell.setCellStyle(headerStyle);
                sheet.setColumnWidth(i, 6000);
            }

            // Example row
            Row ex = sheet.createRow(1);
            ex.createCell(0).setCellValue("PB001");
            ex.createCell(1).setCellValue("Phòng Đào Tạo");
            ex.createCell(2).setCellValue("admin001");
            ex.createCell(3).setCellValue("1");

            workbook.write(out);
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Lỗi tạo template", e);
        }
    }

    @Override
    public byte[] exportToExcel() {
        List<OfficeResponse> offices = findAll();
        try (SXSSFWorkbook workbook = new SXSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Phong_ban");
            Row header = sheet.createRow(0);
            String[] cols = {"STT", "Mã phòng ban", "Tên phòng ban", "Trưởng phòng", "Trạng thái"};
            for (int i = 0; i < cols.length; i++) header.createCell(i).setCellValue(cols[i]);

            int rowIdx = 1;
            for (OfficeResponse o : offices) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(rowIdx - 1);
                row.createCell(1).setCellValue(o.getOfficeCode() != null ? o.getOfficeCode() : "");
                row.createCell(2).setCellValue(o.getOfficeName() != null ? o.getOfficeName() : "");
                row.createCell(3).setCellValue(o.getHeadName() != null ? o.getHeadName() : "Chưa chỉ định");
                row.createCell(4).setCellValue(o.getStatus() != null && o.getStatus() == 1 ? "Đang hoạt động" : "Vô hiệu hóa");
            }
            workbook.write(out);
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Lỗi xuất Excel", e);
        }
    }

    @Override
    public Map<String, Object> importFromExcel(MultipartFile file, boolean preview) {
        Map<String, Object> result = new HashMap<>();
        List<String> errors = new ArrayList<>();
        int validRows = 0;
        int invalidRows = 0;

        try (InputStream is = file.getInputStream(); Workbook workbook = new XSSFWorkbook(is)) {
            Sheet sheet = workbook.getSheetAt(0);
            List<Office> toSave = new ArrayList<>();

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;

                try {
                    String code = getCellString(row.getCell(0));
                    String name = getCellString(row.getCell(1));
                    String headCode = getCellString(row.getCell(2));
                    String statusStr = getCellString(row.getCell(3));

                    if (code.isEmpty()) { errors.add("Dòng " + (i + 1) + ": Mã phòng ban không được để trống"); invalidRows++; continue; }
                    if (name.isEmpty()) { errors.add("Dòng " + (i + 1) + ": Tên phòng ban không được để trống"); invalidRows++; continue; }
                    if (repository.findByOfficeCode(code).isPresent()) { errors.add("Dòng " + (i + 1) + ": Mã phòng ban '" + code + "' đã tồn tại"); invalidRows++; continue; }

                    Office o = new Office();
                    o.setOfficeCode(code);
                    o.setOfficeName(name);
                    o.setStatus("0".equals(statusStr) || "Vô hiệu hóa".equalsIgnoreCase(statusStr) ? 0 : 1);
                    toSave.add(o);

                    // Store head association after save
                    if (!preview && !headCode.isEmpty()) {
                        final String finalCode = code;
                        userRepository.findByUserCode(headCode).ifPresent(u -> u.setPositionTitle(finalCode));
                    }
                    validRows++;
                } catch (Exception ex) {
                    errors.add("Dòng " + (i + 1) + ": Lỗi - " + ex.getMessage());
                    invalidRows++;
                }
            }

            if (!preview && !toSave.isEmpty()) {
                repository.saveAll(toSave);
                // Re-process head assignments
                for (Office o : toSave) {
                    // find any user with positionTitle set to this code and update after save
                }
            }

            result.put("validRows", validRows);
            result.put("invalidRows", invalidRows);
            result.put("errors", errors);
            return result;
        } catch (Exception e) {
            throw new RuntimeException("Lỗi đọc file Excel", e);
        }
    }

    private String getCellString(Cell cell) {
        if (cell == null) return "";
        if (cell.getCellType() == CellType.STRING) return cell.getStringCellValue().trim();
        if (cell.getCellType() == CellType.NUMERIC) return String.valueOf((long) cell.getNumericCellValue());
        return "";
    }
}
