package com.example.backend.core.repository;

import com.example.backend.core.entity.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.Optional;

public interface NotificationRepository {

    Notification save(Notification notification);

    Page<Notification> findByUserId(Long userId, Pageable pageable, boolean unreadOnly);

    Optional<Notification> findByIdAndUserId(Long id, Long userId);

    long countUnreadByUserId(Long userId);

    int markAllAsRead(Long userId, LocalDateTime readAt);

    boolean existsByDedupKey(String dedupKey);
}
