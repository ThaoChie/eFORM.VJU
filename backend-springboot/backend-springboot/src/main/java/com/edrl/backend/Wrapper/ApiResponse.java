package com.edrl.backend.Wrapper;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApiResponse<T> {
    
    private boolean success;
    private String code;
    private String message;
    private T data;
    
    @Builder.Default
    private Instant timestamp = Instant.now();

    // ========================================================================
    // CÁC HÀM TIỆN ÍCH ĐỂ GỌI NHANH TỪ CONTROLLER HOẶC EXCEPTION HANDLER
    // ========================================================================

    /**
     * Trả về thành công chuẩn với dữ liệu.
     * Code mặc định là "OK".
     */
    public static <T> ApiResponse<T> ok(T data) {
        return ApiResponse.<T>builder()
                .success(true)
                .code("OK")
                .message("Thành công")
                .data(data)
                .build();
    }

    /**
     * Trả về thành công với dữ liệu và lời nhắn tùy chỉnh.
     */
    public static <T> ApiResponse<T> ok(T data, String message) {
        return ApiResponse.<T>builder()
                .success(true)
                .code("OK")
                .message(message)
                .data(data)
                .build();
    }

    /**
     * Trả về lỗi (Dùng cho @RestControllerAdvice / GlobalExceptionHandler).
     * Ví dụ: error("VALIDATION_ERROR", "Dữ liệu đầu vào không hợp lệ")
     */
    public static <T> ApiResponse<T> error(String code, String message) {
        return ApiResponse.<T>builder()
                .success(false)
                .code(code)
                .message(message)
                .data(null)
                .build();
    }
}