package vn.edu.drl.backend.workflow.camunda;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.camunda.bpm.engine.delegate.DelegateExecution;
import org.camunda.bpm.engine.delegate.JavaDelegate;
import org.springframework.stereotype.Component;
import vn.edu.drl.backend.dao.UserRepository;
import vn.edu.drl.backend.model.User;
import vn.edu.drl.backend.service.interfaces.EmailService;

import java.time.Instant;

/**
 * Camunda ServiceTask delegate for Flow 1.3:
 * Sends the signature change permission email when Admin grants a 7-day unlock window.
 */
@Slf4j
@Component("sendSignaturePermissionDelegate")
@RequiredArgsConstructor
public class SendSignaturePermissionDelegate implements JavaDelegate {

    private final UserRepository userRepository;
    private final EmailService emailService;

    @Override
    public void execute(DelegateExecution execution) {
        Object rawUserId = execution.getVariable("userId");
        Object rawExpiryMillis = execution.getVariable("expiryMillis");
        if (rawUserId == null) {
            return;
        }
        Long userId = ((Number) rawUserId).longValue();
        Instant expiry = rawExpiryMillis instanceof Number
                ? Instant.ofEpochMilli(((Number) rawExpiryMillis).longValue())
                : Instant.now().plus(7, java.time.temporal.ChronoUnit.DAYS);

        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            log.warn("Camunda SendSignaturePermissionDelegate: userId={} not found", userId);
            return;
        }
        try {
            emailService.sendSignaturePermissionEmail(user, expiry);
        } catch (Exception ex) {
            log.warn("Camunda SendSignaturePermissionDelegate email warning for userId={}: {}", userId, ex.getMessage());
        }
    }
}
