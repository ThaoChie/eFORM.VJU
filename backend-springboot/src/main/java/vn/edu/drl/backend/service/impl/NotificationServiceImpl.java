package vn.edu.drl.backend.service.impl;

import vn.edu.drl.backend.service.interfaces.*;

import vn.edu.drl.backend.service.interfaces.NotificationService;

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

    @Override
    @Transactional
    public void createBatchNotifications(List<User> recipients, String title, String content, NotificationType type, String linkUrl) {
        if (recipients == null || recipients.isEmpty()) return;
        List<Notification> notifications = new java.util.ArrayList<>(recipients.size());
        for (User u : recipients) {
            Notification n = new Notification();
            n.setUser(u);
            n.setTitle(title);
            n.setContent(content);
            n.setType(type);
            n.setLinkUrl(linkUrl);
            notifications.add(n);
        }
        notificationRepository.saveAll(notifications);
    }

    @Override
    @org.springframework.scheduling.annotation.Async
    @Transactional
    public void createBatchNotificationsAsync(List<User> recipients, String title, String content, NotificationType type, String linkUrl) {
        createBatchNotifications(recipients, title, content, type, linkUrl);
    }

    public Map<String, Object> getNotifications(Long userId, Pageable pageable) {
        Page<Notification> page = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
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
