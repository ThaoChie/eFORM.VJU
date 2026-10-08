package vn.edu.drl.backend.service.impl;

import vn.edu.drl.backend.service.*;

import vn.edu.drl.backend.service.NotificationService;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.drl.backend.dao.NotificationRepository;
import vn.edu.drl.backend.dao.UserRepository;
import vn.edu.drl.backend.enu.NotificationType;
import vn.edu.drl.backend.model.Notification;
import vn.edu.drl.backend.model.User;

import java.util.List;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {
    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @Transactional
    public void createNotification(Long userId, String title, String content, NotificationType type, String linkUrl) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        Notification notification = new Notification();
        notification.setUser(user);
        notification.setTitle(title);
        notification.setContent(content);
        notification.setType(type);
        notification.setLinkUrl(linkUrl);
        
        notificationRepository.save(notification);
    }

    public Map<String, Object> getNotifications(Long userId, Pageable pageable) {
        Page<Notification> page = notificationRepository.findByUserId(userId, pageable);
        long unreadCount = notificationRepository.countByUserIdAndIsReadFalse(userId);
        
        Map<String, Object> response = new HashMap<>();
        response.put("data", page.getContent());
        response.put("total", page.getTotalElements());
        response.put("unreadCount", unreadCount);
        return response;
    }

    @Transactional
    public void markAsRead(Long id, Long userId) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Notification not found"));
        if (!notification.getUser().getId().equals(userId)) {
            throw new RuntimeException("Access denied");
        }
        notification.setIsRead(true);
        notificationRepository.save(notification);
    }

    @Transactional
    public void markAllAsRead(Long userId) {
        List<Notification> unread = notificationRepository.findByUserIdAndIsReadFalse(userId);
        for (Notification n : unread) {
            n.setIsRead(true);
        }
        notificationRepository.saveAll(unread);
    }
}
