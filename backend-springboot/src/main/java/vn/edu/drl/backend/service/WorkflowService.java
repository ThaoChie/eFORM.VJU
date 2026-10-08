package vn.edu.drl.backend.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import vn.edu.drl.backend.dao.*;
import vn.edu.drl.backend.dto.request.ClassApproveRequest;
import vn.edu.drl.backend.dto.request.DeanApproveBatchRequest;
import vn.edu.drl.backend.dto.request.RejectRequest;
import vn.edu.drl.backend.dto.response.DeanApproveBatchResponse;
import vn.edu.drl.backend.dto.response.WorkflowDetailResponse;
import vn.edu.drl.backend.dto.response.WorkflowQueueItemResponse;
import vn.edu.drl.backend.enu.NotificationType;
import vn.edu.drl.backend.enu.Role;
import vn.edu.drl.backend.enu.ScoreFormStatus;
import vn.edu.drl.backend.model.*;
import vn.edu.drl.backend.service.engine.*;

import java.math.BigDecimal;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;


public interface WorkflowService {
    Page<WorkflowQueueItemResponse> getPendingQueue(Long userId, Pageable pageable);
    WorkflowDetailResponse getFormDetail(Long userId, Long formId);
    void classApprove(Long userId, Long formId, ClassApproveRequest request, String ipAddress);
    void rejectForm(Long userId, Long formId, RejectRequest request);
    DeanApproveBatchResponse deanApproveBatch(Long userId, DeanApproveBatchRequest request, String ipAddress);
}
