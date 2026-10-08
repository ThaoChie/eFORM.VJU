package vn.edu.drl.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import vn.edu.drl.backend.dto.request.FieldMasterRequest;
import vn.edu.drl.backend.dto.response.FieldMasterResponse;
import vn.edu.drl.backend.enu.FieldDataType;
import vn.edu.drl.backend.model.FieldMaster;
import vn.edu.drl.backend.service.FieldMasterService;

import java.util.Collections;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(FieldMasterController.class)
class FieldMasterControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private FieldMasterService fieldMasterService;

    @Autowired
    private ObjectMapper objectMapper;

    private FieldMasterRequest validRequest;
    private FieldMasterResponse validResponse;

    @BeforeEach
    void setUp() {
        validRequest = new FieldMasterRequest();
        validRequest.setFieldCode("test_code");
        validRequest.setFieldName("Test Code");
        validRequest.setDataType(FieldDataType.STRING);

        FieldMaster entity = new FieldMaster();
        entity.setId(1L);
        entity.setFieldCode("test_code");
        entity.setFieldName("Test Code");
        entity.setDataType(FieldDataType.STRING);
        entity.setIsActive(true);
        validResponse = new FieldMasterResponse(entity);
    }

    @Test
    @WithMockUser(authorities = "ADMIN")
    void getFields_Success() throws Exception {
        Mockito.when(fieldMasterService.getAllFields(any(Pageable.class)))
                .thenReturn(new PageImpl<>(Collections.singletonList(validResponse)));

        mockMvc.perform(get("/api/v1/fields")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content[0].fieldCode").value("test_code"));
    }

    @Test
    @WithMockUser(authorities = "ADMIN")
    void createField_Success() throws Exception {
        Mockito.when(fieldMasterService.createField(any(FieldMasterRequest.class)))
                .thenReturn(validResponse);

        mockMvc.perform(post("/api/v1/fields")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(validRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.fieldCode").value("test_code"));
    }

    @Test
    @WithMockUser(authorities = "ADMIN")
    void createField_ValidationError() throws Exception {
        validRequest.setFieldCode("Invalid-Code!"); // Should be snake_case

        mockMvc.perform(post("/api/v1/fields")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(validRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
    }

    @Test
    @WithMockUser(authorities = "ADMIN")
    void updateField_Success() throws Exception {
        Mockito.when(fieldMasterService.updateField(eq(1L), any(FieldMasterRequest.class)))
                .thenReturn(validResponse);

        mockMvc.perform(put("/api/v1/fields/1")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(validRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @WithMockUser(authorities = "ADMIN")
    void toggleStatus_Success() throws Exception {
        Mockito.when(fieldMasterService.toggleStatus(1L)).thenReturn(validResponse);

        mockMvc.perform(patch("/api/v1/fields/1/toggle-status")
                .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }
}
