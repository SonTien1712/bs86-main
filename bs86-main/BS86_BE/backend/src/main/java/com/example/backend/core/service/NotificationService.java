package com.example.backend.core.service;

import com.example.backend.core.entity.Booking;
import com.example.backend.core.entity.Notification;
import com.example.backend.core.entity.User;
import com.example.backend.core.enums.NotificationEvent;
import com.example.backend.core.enums.NotificationType;
import com.example.backend.core.enums.OrderStatus;
import org.springframework.data.domain.Page;

public interface NotificationService {

    Page<Notification> getUserNotifications(Long userId, int page, int size, boolean unreadOnly);

    long getUnreadCount(Long userId);

    Notification markAsRead(Long userId, Long notificationId);

    int markAllAsRead(Long userId);

    Notification createNotification(
            Long userId,
            NotificationType type,
            NotificationEvent eventCode,
            String title,
            String message,
            String relatedEntityType,
            Long relatedEntityId,
            String actionUrl,
            String metadataJson,
            String dedupKey
    );

    void notifyBookingCreated(Booking booking);

    void notifyBookingStatusChanged(Booking booking, OrderStatus previousStatus, OrderStatus newStatus);

    void notifyBookingCancelled(Booking booking, String reason, boolean cancelledByCustomer);

    void notifyPaymentSuccess(Booking booking);

    void notifyPaymentFailure(Booking booking, String reason);

    void notifyPaymentExpired(Booking booking);

    void notifyUpcomingBookingReminder(Booking booking);

    void notifyNewUserRegistered(User user);
}
