package vn.edu.drl.backend.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.security.access.AccessDeniedException;
import vn.edu.drl.backend.Wrapper.ApiResponse;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> handleValidationExceptions(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(error -> 
            errors.put(error.getField(), error.getDefaultMessage()));
        
        ApiResponse<Map<String, String>> response = ApiResponse.error("VALIDATION_ERROR", "Dữ liệu không hợp lệ");
        response.setData(errors);
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<Void>> handleAccessDeniedException(AccessDeniedException ex) {
        return new ResponseEntity<>(ApiResponse.error("FORBIDDEN", "Không đủ quyền truy cập"), HttpStatus.FORBIDDEN);
    }

    @ExceptionHandler({RuntimeException.class, vn.edu.drl.backend.exception.BusinessException.class})
    public ResponseEntity<ApiResponse<Void>> handleBusinessException(RuntimeException ex) {
        return new ResponseEntity<>(ApiResponse.error("BAD_REQUEST", ex.getMessage()), HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleGenericException(Exception ex) {
        String message = ex.getMessage();
        if (message != null && message.contains("409")) {
            return new ResponseEntity<>(ApiResponse.error("FORM_LOCKED", message), HttpStatus.CONFLICT);
        }
        if (message != null && message.contains("422")) {
            return new ResponseEntity<>(ApiResponse.error("INVALID_TRANSITION", message), HttpStatus.UNPROCESSABLE_ENTITY);
        }
        return new ResponseEntity<>(ApiResponse.error("INTERNAL_ERROR", "Lỗi máy chủ nội bộ"), HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
