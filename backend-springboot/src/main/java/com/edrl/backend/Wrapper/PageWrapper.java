package com.edrl.backend.Wrapper;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.domain.Page;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PageWrapper<T> {
    
    private List<T> content;
    private int page;          // Lưu ý: BE lưu 0-based (trang đầu tiên = 0)
    private int size;
    private long totalElements;
    private int totalPages;

    // ========================================================================
    // HÀM TIỆN ÍCH CHUYỂN ĐỔI TỪ SPRING DATA PAGE -> PAGE WRAPPER
    // ========================================================================

    /**
     * Hàm helper giúp chuyển đổi nhanh từ đối tượng Page của Spring Data JPA
     * sang định dạng chuẩn của hệ thống E-DRL.
     * 
     * @param pageData Đối tượng phân trang từ repository trả về
     * @return PageWrapper chứa dữ liệu danh sách
     */
    public static <T> PageWrapper<T> of(Page<T> pageData) {
        return PageWrapper.<T>builder()
                .content(pageData.getContent())
                .page(pageData.getNumber()) // Lấy current page (0-based)
                .size(pageData.getSize())
                .totalElements(pageData.getTotalElements())
                .totalPages(pageData.getTotalPages())
                .build();
    }
}