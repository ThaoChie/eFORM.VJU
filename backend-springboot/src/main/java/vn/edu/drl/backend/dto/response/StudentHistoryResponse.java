package vn.edu.drl.backend.dto.response;

import lombok.Data;
import vn.edu.drl.backend.enu.ScoreFormStatus;
import java.math.BigDecimal;
import java.time.Instant;

@Data
public class StudentHistoryResponse {
    private Long id;
    private Long semesterId;
    private String semesterName;
    private String academicYear;
    private BigDecimal studentTotal;
    private BigDecimal classTotal;
    private BigDecimal finalTotal;
    private BigDecimal score;
    private String ranking;
    private ScoreFormStatus status;
    private Instant createdAt;
    private Instant updatedAt;
    private String pdfFileUrl;
}
