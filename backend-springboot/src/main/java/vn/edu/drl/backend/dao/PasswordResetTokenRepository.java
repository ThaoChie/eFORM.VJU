package vn.edu.drl.backend.dao;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.edu.drl.backend.model.PasswordResetToken;

import java.util.Optional;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {
    Optional<PasswordResetToken> findByTokenAndIsUsedFalse(String token);
    Optional<PasswordResetToken> findByUserIdAndOtpAndIsUsedFalse(Long userId, String otp);
    Optional<PasswordResetToken> findTopByUserIdAndIsUsedFalseOrderByExpiresAtDesc(Long userId);
}
