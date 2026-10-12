package vn.edu.drl.backend.service.impl;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.drl.backend.dao.CriteriaRepository;
import vn.edu.drl.backend.dao.FieldMasterHistoryRepository;
import vn.edu.drl.backend.dao.FieldMasterRepository;
import vn.edu.drl.backend.dto.request.FieldMasterRequest;
import vn.edu.drl.backend.dto.response.FieldMasterHistoryResponse;
import vn.edu.drl.backend.dto.response.FieldMasterResponse;
import vn.edu.drl.backend.model.FieldMaster;
import vn.edu.drl.backend.model.FieldMasterHistory;
import vn.edu.drl.backend.service.FieldMasterService;

import java.time.Instant;
import java.util.*;
import java.util.regex.Pattern;
import java.util.regex.PatternSyntaxException;
import java.util.stream.Collectors;
import java.math.BigDecimal;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.web.multipart.MultipartFile;
import vn.edu.drl.backend.enu.FieldDataType;

@Service
public class FieldMasterServiceImpl implements FieldMasterService {
    private final FieldMasterRepository fieldMasterRepository;
    private final CriteriaRepository criteriaRepository;
    private final FieldMasterHistoryRepository fieldMasterHistoryRepository;

    public FieldMasterServiceImpl(FieldMasterRepository fieldMasterRepository,
                                  CriteriaRepository criteriaRepository,
                                  FieldMasterHistoryRepository fieldMasterHistoryRepository) {
        this.fieldMasterRepository = fieldMasterRepository;
        this.criteriaRepository = criteriaRepository;
        this.fieldMasterHistoryRepository = fieldMasterHistoryRepository;
    }

    @Override
    public Page<FieldMasterResponse> getAllFields(Pageable pageable) {
        return fieldMasterRepository.findAll(pageable).map(FieldMasterResponse::new);
    }

    @Override
    public FieldMasterResponse getFieldById(Long id) {
        FieldMaster field = fieldMasterRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("NOT_FOUND"));
        
        List<FieldMasterHistoryResponse> histories = getFieldHistories(id);
        if (histories.isEmpty()) {
            saveHistory(field);
            histories = getFieldHistories(id);
        }
        
        FieldMasterResponse response = new FieldMasterResponse(field);
        response.setVersions(histories);
        return response;
    }

    @Override
    public List<FieldMasterHistoryResponse> getFieldHistories(Long id) {
        return fieldMasterHistoryRepository.findByFieldIdOrderByIdDesc(id)
                .stream()
                .map(FieldMasterHistoryResponse::new)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public FieldMasterResponse createField(FieldMasterRequest request) {
        validateRequest(request, null);
        FieldMaster field = new FieldMaster();
        mapToEntity(request, field);
        field.setVersion("1.0");
        Instant now = Instant.now();
        field.setUpdatedAt(now);
        field = fieldMasterRepository.save(field);

        // Save snapshot for version 1.0
        saveHistory(field);

        FieldMasterResponse response = new FieldMasterResponse(field);
        response.setVersions(getFieldHistories(field.getId()));
        return response;
    }

    @Override
    @Transactional
    public FieldMasterResponse updateField(Long id, FieldMasterRequest request) {
        FieldMaster field = fieldMasterRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("NOT_FOUND"));
        
        validateRequest(request, id);
        
        if (!field.getFieldCode().equals(request.getFieldCode())) {
            if (criteriaRepository.existsByFieldMasterId(id)) {
                throw new RuntimeException("FORM_LOCKED_FIELD_CODE");
            }
        }

        // Safety: If no prior history existed, archive current state before updating
        if (fieldMasterHistoryRepository.findByFieldIdOrderByIdDesc(id).isEmpty()) {
            saveHistory(field);
        }
        
        mapToEntity(request, field);
        String nextVer = incrementVersion(field.getVersion());
        field.setVersion(nextVer);
        field.setUpdatedAt(Instant.now());
        field = fieldMasterRepository.save(field);

        // Save history snapshot for the new version
        saveHistory(field);

        FieldMasterResponse response = new FieldMasterResponse(field);
        response.setVersions(getFieldHistories(id));
        return response;
    }

    @Override
    @Transactional
    public FieldMasterResponse toggleStatus(Long id) {
        FieldMaster field = fieldMasterRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("NOT_FOUND"));
        field.setIsActive(!field.getIsActive());
        field.setUpdatedAt(Instant.now());
        field = fieldMasterRepository.save(field);
        return new FieldMasterResponse(field);
    }

    public static String incrementVersion(String currentVersion) {
        if (currentVersion == null || currentVersion.trim().isEmpty()) {
            return "1.1";
        }
        String v = currentVersion.trim();
        if (v.startsWith("v") || v.startsWith("V")) {
            v = v.substring(1);
        }
        String[] parts = v.split("\\.");
        if (parts.length >= 2) {
            try {
                int major = Integer.parseInt(parts[0]);
                int minor = Integer.parseInt(parts[1]);
                return major + "." + (minor + 1);
            } catch (NumberFormatException ignored) {
            }
        } else if (parts.length == 1) {
            try {
                int major = Integer.parseInt(parts[0]);
                return major + ".1";
            } catch (NumberFormatException ignored) {
            }
        }
        return "1.1";
    }

    private void saveHistory(FieldMaster field) {
        FieldMasterHistory history = new FieldMasterHistory();
        history.setFieldId(field.getId());
        history.setVersion(field.getVersion() != null ? field.getVersion() : "1.0");
        history.setFieldCode(field.getFieldCode());
        history.setFieldName(field.getFieldName());
        history.setDataType(field.getDataType());
        history.setCategory(field.getCategory());
        history.setIsRequired(field.getIsRequired());
        history.setMinValue(field.getMinValue());
        history.setMaxValue(field.getMaxValue());
        history.setRegexPattern(field.getRegexPattern());
        history.setDescription(field.getDescription());
        history.setIsActive(field.getIsActive());
        history.setCreatedAt(field.getUpdatedAt() != null ? field.getUpdatedAt() : Instant.now());
        fieldMasterHistoryRepository.save(history);
    }

    private void validateRequest(FieldMasterRequest request, Long excludeId) {
        if (request.getMinValue() != null && request.getMaxValue() != null) {
            if (request.getMinValue().compareTo(request.getMaxValue()) > 0) {
                throw new RuntimeException("VALIDATION_ERROR: min_value must be <= max_value");
            }
        }
        if (request.getRegexPattern() != null && !request.getRegexPattern().isEmpty()) {
            try {
                Pattern.compile(request.getRegexPattern());
            } catch (PatternSyntaxException e) {
                throw new RuntimeException("VALIDATION_ERROR: Invalid regex pattern");
            }
        }
        if (excludeId == null) {
            if (fieldMasterRepository.existsByFieldCode(request.getFieldCode())) {
                throw new RuntimeException("DUPLICATE: field_code exists");
            }
        }
    }

    private void mapToEntity(FieldMasterRequest request, FieldMaster field) {
        field.setFieldCode(request.getFieldCode());
        field.setFieldName(request.getFieldName());
        field.setDataType(request.getDataType());
        field.setCategory(request.getCategory());
        field.setIsRequired(request.getIsRequired() != null ? request.getIsRequired() : false);
        field.setMinValue(request.getMinValue());
        field.setMaxValue(request.getMaxValue());
        field.setRegexPattern(request.getRegexPattern());
        field.setDescription(request.getDescription());
    }

    @Override
    public byte[] generateExcelTemplate() {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Truong_thong_tin");

            CellStyle headerStyle = workbook.createCellStyle();
            Font font = workbook.createFont();
            font.setBold(true);
            headerStyle.setFont(font);
            headerStyle.setFillForegroundColor(IndexedColors.LIGHT_BLUE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            Row header = sheet.createRow(0);
            String[] headers = {
                "Mã trường (*)", "Tên trường (*)", "Kiểu dữ liệu (*)", "Nhóm trường",
                "Bắt buộc (1/0)", "Giá trị min", "Giá trị max", "Regex kiểm tra", "Mô tả", "Trạng thái (1/0)"
            };
            for (int i = 0; i < headers.length; i++) {
                Cell cell = header.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
                sheet.setColumnWidth(i, 6000);
            }

            String[][] samples = {
                {"HO_TEN_SV", "Họ và tên sinh viên", "STRING", "COMMON", "1", "", "100", "", "Họ tên đầy đủ theo hồ sơ sinh viên", "1"},
                {"DIEM_TB", "Điểm trung bình học tập", "NUMBER", "ACADEMIC", "0", "0", "10", "", "Điểm thang 10", "1"},
                {"XEP_LOAI_RL", "Xếp loại rèn luyện", "STRING", "DISCIPLINE", "1", "", "", "", "Xuất sắc, Tốt, Khá, TB", "1"},
                {"NGAY_CAP_THE", "Ngày cấp thẻ sinh viên", "DATE", "COMMON", "0", "", "", "", "Định dạng YYYY-MM-DD", "1"}
            };
            for (int r = 0; r < samples.length; r++) {
                Row row = sheet.createRow(r + 1);
                for (int c = 0; c < samples[r].length; c++) {
                    row.createCell(c).setCellValue(samples[r][c]);
                }
            }

            workbook.write(out);
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Lỗi tạo template Excel: " + e.getMessage(), e);
        }
    }

    @Override
    @Transactional
    public Map<String, Object> importFromExcel(MultipartFile file, boolean preview) {
        Map<String, Object> result = new HashMap<>();
        List<String> errors = new ArrayList<>();
        int validRows = 0;
        int invalidRows = 0;

        List<FieldMaster> fieldsToSave = new ArrayList<>();
        DataFormatter formatter = new DataFormatter();
        Set<String> seenFieldCodes = new HashSet<>();

        try (InputStream is = file.getInputStream(); Workbook workbook = WorkbookFactory.create(is)) {
            Sheet sheet = workbook.getSheetAt(0);

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (isRowEmpty(row, formatter)) continue;

                int rowNum = i + 1;
                try {
                    String fieldCode = getCellString(formatter, row.getCell(0)).trim();
                    String fieldName = getCellString(formatter, row.getCell(1)).trim();
                    String dataTypeStr = getCellString(formatter, row.getCell(2)).trim().toUpperCase();
                    String category = getCellString(formatter, row.getCell(3)).trim();
                    String isRequiredStr = getCellString(formatter, row.getCell(4)).trim();
                    String minValStr = getCellString(formatter, row.getCell(5)).trim();
                    String maxValStr = getCellString(formatter, row.getCell(6)).trim();
                    String regexPattern = getCellString(formatter, row.getCell(7)).trim();
                    String description = getCellString(formatter, row.getCell(8)).trim();
                    String statusStr = row.getLastCellNum() > 9 ? getCellString(formatter, row.getCell(9)).trim() : "";

                    if (fieldCode.isEmpty()) {
                        errors.add("Dòng " + rowNum + ": Mã trường không được để trống");
                        invalidRows++;
                        continue;
                    }
                    if (fieldCode.length() > 100) {
                        errors.add("Dòng " + rowNum + ": Mã trường không được vượt quá 100 ký tự");
                        invalidRows++;
                        continue;
                    }
                    if (!fieldCode.matches("^[a-zA-Z0-9_]+$")) {
                        errors.add("Dòng " + rowNum + ": Mã trường '" + fieldCode + "' chỉ được chứa chữ cái, số và dấu gạch dưới");
                        invalidRows++;
                        continue;
                    }
                    if (seenFieldCodes.contains(fieldCode.toLowerCase())) {
                        errors.add("Dòng " + rowNum + ": Mã trường '" + fieldCode + "' bị trùng lặp trong file tải lên");
                        invalidRows++;
                        continue;
                    }
                    if (fieldMasterRepository.existsByFieldCode(fieldCode)) {
                        errors.add("Dòng " + rowNum + ": Mã trường '" + fieldCode + "' đã tồn tại trong hệ thống");
                        invalidRows++;
                        continue;
                    }

                    if (fieldName.isEmpty()) {
                        errors.add("Dòng " + rowNum + ": Tên trường không được để trống");
                        invalidRows++;
                        continue;
                    }

                    FieldDataType dataType;
                    try {
                        if (dataTypeStr.equals("TEXT") || dataTypeStr.equals("CHUOI")) {
                            dataType = FieldDataType.STRING;
                        } else if (dataTypeStr.equals("SO")) {
                            dataType = FieldDataType.NUMBER;
                        } else if (dataTypeStr.equals("NGAY")) {
                            dataType = FieldDataType.DATE;
                        } else if (dataTypeStr.equals("CHECKBOX")) {
                            dataType = FieldDataType.BOOLEAN;
                        } else if (dataTypeStr.equals("SELECT")) {
                            dataType = FieldDataType.ARRAY;
                        } else if (dataTypeStr.equals("CHU_KY")) {
                            dataType = FieldDataType.SIGNATURE;
                        } else {
                            dataType = FieldDataType.valueOf(dataTypeStr);
                        }
                    } catch (Exception ex) {
                        errors.add("Dòng " + rowNum + ": Kiểu dữ liệu '" + dataTypeStr + "' không hợp lệ (hỗ trợ: STRING, NUMBER, DATE, BOOLEAN, ARRAY, FILE, SIGNATURE)");
                        invalidRows++;
                        continue;
                    }

                    BigDecimal minVal = null;
                    if (!minValStr.isEmpty()) {
                        try {
                            minVal = new BigDecimal(minValStr);
                        } catch (Exception ex) {
                            errors.add("Dòng " + rowNum + ": Giá trị min '" + minValStr + "' không phải là số hợp lệ");
                            invalidRows++;
                            continue;
                        }
                    }

                    BigDecimal maxVal = null;
                    if (!maxValStr.isEmpty()) {
                        try {
                            maxVal = new BigDecimal(maxValStr);
                        } catch (Exception ex) {
                            errors.add("Dòng " + rowNum + ": Giá trị max '" + maxValStr + "' không phải là số hợp lệ");
                            invalidRows++;
                            continue;
                        }
                    }

                    if (minVal != null && maxVal != null && minVal.compareTo(maxVal) > 0) {
                        errors.add("Dòng " + rowNum + ": Giá trị min không được lớn hơn giá trị max");
                        invalidRows++;
                        continue;
                    }

                    if (!regexPattern.isEmpty()) {
                        try {
                            Pattern.compile(regexPattern);
                        } catch (PatternSyntaxException ex) {
                            errors.add("Dòng " + rowNum + ": Regex pattern không đúng cú pháp");
                            invalidRows++;
                            continue;
                        }
                    }

                    seenFieldCodes.add(fieldCode.toLowerCase());

                    FieldMaster fm = new FieldMaster();
                    fm.setFieldCode(fieldCode);
                    fm.setFieldName(fieldName);
                    fm.setDataType(dataType);
                    fm.setCategory(category.isEmpty() ? "COMMON" : category);
                    fm.setIsRequired("1".equals(isRequiredStr) || "true".equalsIgnoreCase(isRequiredStr) || "có".equalsIgnoreCase(isRequiredStr));
                    fm.setMinValue(minVal);
                    fm.setMaxValue(maxVal);
                    fm.setRegexPattern(regexPattern.isEmpty() ? null : regexPattern);
                    fm.setDescription(description.isEmpty() ? null : description);
                    fm.setIsActive(!"0".equals(statusStr) && !"false".equalsIgnoreCase(statusStr) && !"Vô hiệu hóa".equalsIgnoreCase(statusStr));
                    fm.setVersion("1.0");
                    fm.setUpdatedAt(Instant.now());

                    fieldsToSave.add(fm);
                    validRows++;
                } catch (Exception ex) {
                    errors.add("Dòng " + rowNum + ": Lỗi định dạng - " + ex.getMessage());
                    invalidRows++;
                }
            }
        } catch (Exception e) {
            throw new RuntimeException("Lỗi đọc file Excel: " + e.getMessage(), e);
        }

        if (!preview && !fieldsToSave.isEmpty()) {
            for (FieldMaster fm : fieldsToSave) {
                FieldMaster saved = fieldMasterRepository.save(fm);
                saveHistory(saved);
            }
        }

        result.put("validRows", validRows);
        result.put("invalidRows", invalidRows);
        result.put("errors", errors);
        return result;
    }

    private String getCellString(DataFormatter formatter, Cell cell) {
        if (cell == null) return "";
        return formatter.formatCellValue(cell).trim();
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
}
