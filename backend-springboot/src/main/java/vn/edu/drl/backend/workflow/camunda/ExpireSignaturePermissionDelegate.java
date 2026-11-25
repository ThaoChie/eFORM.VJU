package vn.edu.drl.backend.workflow.camunda;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.camunda.bpm.engine.delegate.DelegateExecution;
import org.camunda.bpm.engine.delegate.JavaDelegate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.drl.backend.dao.UserRepository;
import vn.edu.drl.backend.model.User;

/**
 * Camunda ServiceTask delegate triggered when the 7-day (P7D) timer expires
 * without the user updating their signature. Re-locks signature modification.
 */
@Slf4j
@Component("expireSignaturePermissionDelegate")
@RequiredArgsConstructor
public class ExpireSignaturePermissionDelegate implements JavaDelegate {

    private final UserRepository userRepository;

    @Override
    @Transactional
    public void execute(DelegateExecution execution) {
        Object rawUserId = execution.getVariable("userId");
        if (rawUserId == null) {
            return;
        }
        Long userId = ((Number) rawUserId).longValue();
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            log.warn("Camunda ExpireSignaturePermissionDelegate: userId={} not found", userId);
            return;
        }
        user.setIsSignatureLocked(true);
        user.setSignatureUnlockedUntil(null);
        userRepository.save(user);
        log.info("Camunda P7D timer expired: re-locked signature for userId={}", userId);
    }
}
