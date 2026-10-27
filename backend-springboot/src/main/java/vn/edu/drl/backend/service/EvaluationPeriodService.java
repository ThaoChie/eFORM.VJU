package vn.edu.drl.backend.service;

import vn.edu.drl.backend.dto.request.EvaluationPeriodRequest;
import vn.edu.drl.backend.dto.request.ExtendDeadlineRequest;
import vn.edu.drl.backend.dto.response.EvaluationPeriodFormOptionsResponse;
import vn.edu.drl.backend.dto.response.EvaluationPeriodResponse;
import vn.edu.drl.backend.enu.EvaluationPeriodStatus;

import java.util.List;

public interface EvaluationPeriodService {
    List<EvaluationPeriodResponse> searchPeriods(String keyword, Long semesterId, EvaluationPeriodStatus status);

    EvaluationPeriodResponse getPeriodById(Long id);

    EvaluationPeriodResponse createPeriod(Long adminUserId, EvaluationPeriodRequest request);

    EvaluationPeriodResponse openPeriod(Long adminUserId, Long id);

    EvaluationPeriodResponse extendDeadline(Long adminUserId, Long id, ExtendDeadlineRequest request);

    EvaluationPeriodResponse closePeriod(Long adminUserId, Long id);

    EvaluationPeriodFormOptionsResponse getFormOptions();

    EvaluationPeriodResponse getActivePeriod();
}
