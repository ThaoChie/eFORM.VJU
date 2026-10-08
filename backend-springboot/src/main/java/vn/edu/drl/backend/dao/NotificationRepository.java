package vn.edu.drl.backend.dao;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.edu.drl.backend.model.Notification;
import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    Page<Notification> findByUserId(Long userId, Pageable pageable);
    long countByUserIdAndIsReadFalse(Long userId);
    List<Notification> findByUserIdAndIsReadFalse(Long userId);
}
