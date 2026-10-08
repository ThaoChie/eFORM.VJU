package vn.edu.drl.backend.dto.request;
import lombok.Data;
import java.math.BigDecimal;
import java.util.Map;
@Data
public class DraftRequest {
    private Long semesterId;
    private Map<Long, BigDecimal> scores;
}
