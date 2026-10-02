package vn.edu.drl.backend.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import vn.edu.drl.backend.dao.CriteriaRepository;
import vn.edu.drl.backend.dao.FieldMasterRepository;
import vn.edu.drl.backend.dto.request.FieldMasterRequest;
import vn.edu.drl.backend.dto.response.FieldMasterResponse;
import vn.edu.drl.backend.enu.FieldDataType;
import vn.edu.drl.backend.model.FieldMaster;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FieldMasterServiceTest {

    @Mock
    private FieldMasterRepository fieldMasterRepository;

    @Mock
    private CriteriaRepository criteriaRepository;

    @InjectMocks
    private FieldMasterService fieldMasterService;

    private FieldMasterRequest validRequest;
    private FieldMaster mockField;

    @BeforeEach
    void setUp() {
        validRequest = new FieldMasterRequest();
        validRequest.setFieldCode("test_field");
        validRequest.setFieldName("Test Field");
        validRequest.setDataType(FieldDataType.NUMBER);
        validRequest.setMinValue(new BigDecimal("0"));
        validRequest.setMaxValue(new BigDecimal("100"));

        mockField = new FieldMaster();
        mockField.setId(1L);
        mockField.setFieldCode("test_field");
        mockField.setFieldName("Test Field");
        mockField.setDataType(FieldDataType.NUMBER);
        mockField.setIsActive(true);
    }

    @Test
    void createField_Success() {
        when(fieldMasterRepository.existsByFieldCode("test_field")).thenReturn(false);
        when(fieldMasterRepository.save(any(FieldMaster.class))).thenReturn(mockField);

        FieldMasterResponse response = fieldMasterService.createField(validRequest);

        assertNotNull(response);
        assertEquals("test_field", response.getFieldCode());
        verify(fieldMasterRepository, times(1)).save(any(FieldMaster.class));
    }

    @Test
    void createField_DuplicateFieldCode_ThrowsException() {
        when(fieldMasterRepository.existsByFieldCode("test_field")).thenReturn(true);

        RuntimeException ex = assertThrows(RuntimeException.class, () -> fieldMasterService.createField(validRequest));
        assertEquals("DUPLICATE: field_code exists", ex.getMessage());
    }

    @Test
    void createField_InvalidMinMax_ThrowsException() {
        validRequest.setMinValue(new BigDecimal("100"));
        validRequest.setMaxValue(new BigDecimal("0"));

        RuntimeException ex = assertThrows(RuntimeException.class, () -> fieldMasterService.createField(validRequest));
        assertEquals("VALIDATION_ERROR: min_value must be <= max_value", ex.getMessage());
    }

    @Test
    void createField_InvalidRegex_ThrowsException() {
        validRequest.setRegexPattern("[A-Z"); // Invalid Regex

        RuntimeException ex = assertThrows(RuntimeException.class, () -> fieldMasterService.createField(validRequest));
        assertEquals("VALIDATION_ERROR: Invalid regex pattern", ex.getMessage());
    }

    @Test
    void updateField_Success() {
        when(fieldMasterRepository.findById(1L)).thenReturn(Optional.of(mockField));
        when(fieldMasterRepository.save(any(FieldMaster.class))).thenReturn(mockField);

        FieldMasterResponse response = fieldMasterService.updateField(1L, validRequest);

        assertNotNull(response);
        verify(fieldMasterRepository, times(1)).save(any(FieldMaster.class));
    }

    @Test
    void updateField_ChangeFieldCodeLocked_ThrowsException() {
        FieldMasterRequest newRequest = new FieldMasterRequest();
        newRequest.setFieldCode("new_code");
        newRequest.setDataType(FieldDataType.STRING);

        when(fieldMasterRepository.findById(1L)).thenReturn(Optional.of(mockField));
        when(criteriaRepository.existsByFieldMasterId(1L)).thenReturn(true);

        RuntimeException ex = assertThrows(RuntimeException.class, () -> fieldMasterService.updateField(1L, newRequest));
        assertEquals("FORM_LOCKED_FIELD_CODE", ex.getMessage());
    }

    @Test
    void toggleStatus_Success() {
        when(fieldMasterRepository.findById(1L)).thenReturn(Optional.of(mockField));
        when(fieldMasterRepository.save(any(FieldMaster.class))).thenAnswer(invocation -> invocation.getArgument(0));

        FieldMasterResponse response = fieldMasterService.toggleStatus(1L);

        assertFalse(response.getIsActive()); // Original was true, should be toggled to false
        verify(fieldMasterRepository, times(1)).save(any(FieldMaster.class));
    }
}
