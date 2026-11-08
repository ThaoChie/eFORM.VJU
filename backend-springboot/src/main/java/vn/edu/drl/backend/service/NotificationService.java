package vn.edu.drl.backend.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import vn.edu.drl.backend.dao.NotificationRepository;
import vn.edu.drl.backend.dao.UserRepository;
import vn.edu.drl.backend.enu.NotificationType;
import vn.edu.drl.backend.model.Notification;
import vn.edu.drl.backend.model.User;

import java.util.List;
import java.util.HashMap;
import java.util.Map;


public interface NotificationService {
    void createNotification(Long userId, String title, String content, NotificationType type, String linkUrl);
    Map<String, Object> getNotifications(Long userId, Pageable pageable);
    void markAsRead(Long id, Long userId);
    void markAllAsRead(Long userId);
}
