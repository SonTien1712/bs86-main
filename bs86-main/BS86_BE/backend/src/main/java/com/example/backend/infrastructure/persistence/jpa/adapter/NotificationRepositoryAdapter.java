package com.example.backend.infrastructure.persistence.jpa.adapter;

import com.example.backend.core.entity.Notification;
import com.example.backend.core.entity.User;
import com.example.backend.core.repository.NotificationRepository;
import com.example.backend.infrastructure.persistence.jpa.entity.NotificationEntity;
import com.example.backend.infrastructure.persistence.jpa.entity.UserEntity;
import com.example.backend.infrastructure.persistence.jpa.repository.NotificationJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class NotificationRepositoryAdapter implements NotificationRepository {

    private final NotificationJpaRepository notificationJpaRepository;

    @Override
    public Notification save(Notification notification) {
        NotificationEntity saved = notificationJpaRepository.save(toEntity(notification));
        return toDomain(saved);
    }

    @Override
    public Page<Notification> findByUserId(Long userId, Pageable pageable, boolean unreadOnly) {
        Page<NotificationEntity> page = unreadOnly
                ? notificationJpaRepository.findByUser_IdAndIsReadFalseAndDeletedFalseOrderByCreatedAtDesc(userId, pageable)
                : notificationJpaRepository.findByUser_IdAndDeletedFalseOrderByCreatedAtDesc(userId, pageable);
        return page.map(this::toDomain);
    }

    @Override
    public Optional<Notification> findByIdAndUserId(Long id, Long userId) {
        return notificationJpaRepository.findByIdAndUser_IdAndDeletedFalse(id, userId)
                .map(this::toDomain);
    }

    @Override
    public long countUnreadByUserId(Long userId) {
        return notificationJpaRepository.countByUser_IdAndIsReadFalseAndDeletedFalse(userId);
    }

    @Override
    public int markAllAsRead(Long userId, LocalDateTime readAt) {
        return notificationJpaRepository.markAllAsRead(userId, readAt);
    }

    @Override
    public boolean existsByDedupKey(String dedupKey) {
        return dedupKey != null && !dedupKey.isBlank() && notificationJpaRepository.existsByDedupKey(dedupKey);
    }

    private NotificationEntity toEntity(Notification notification) {
        NotificationEntity entity = new NotificationEntity();
        entity.setId(notification.getId());
        entity.setTitle(notification.getTitle());
        entity.setMessage(notification.getMessage());
        entity.setType(notification.getType());
        entity.setEventCode(notification.getEventCode());
        entity.setRead(notification.isRead());
        entity.setReadAt(notification.getReadAt());
        entity.setRelatedEntityType(notification.getRelatedEntityType());
        entity.setRelatedEntityId(notification.getRelatedEntityId());
        entity.setActionUrl(notification.getActionUrl());
        entity.setMetadataJson(notification.getMetadataJson());
        entity.setDedupKey(notification.getDedupKey());
        entity.setCreatedAt(notification.getCreatedAt());
        entity.setCreatedBy(notification.getCreatedBy());
        entity.setUpdatedAt(notification.getUpdatedAt());
        entity.setUpdatedBy(notification.getUpdatedBy());
        entity.setDeleted(notification.getDeleted());
        entity.setDeletedAt(notification.getDeletedAt());
        entity.setDeletedBy(notification.getDeletedBy());

        User user = notification.getUser();
        Long userId = user != null ? user.getId() : notification.getUserId();
        if (userId != null) {
            UserEntity userEntity = new UserEntity();
            userEntity.setId(userId);
            entity.setUser(userEntity);
        }
        return entity;
    }

    private Notification toDomain(NotificationEntity entity) {
        Notification notification = new Notification();
        notification.setId(entity.getId());
        notification.setTitle(entity.getTitle());
        notification.setMessage(entity.getMessage());
        notification.setType(entity.getType());
        notification.setEventCode(entity.getEventCode());
        notification.setRead(entity.isRead());
        notification.setReadAt(entity.getReadAt());
        notification.setRelatedEntityType(entity.getRelatedEntityType());
        notification.setRelatedEntityId(entity.getRelatedEntityId());
        notification.setActionUrl(entity.getActionUrl());
        notification.setMetadataJson(entity.getMetadataJson());
        notification.setDedupKey(entity.getDedupKey());
        notification.setCreatedAt(entity.getCreatedAt());
        notification.setCreatedBy(entity.getCreatedBy());
        notification.setUpdatedAt(entity.getUpdatedAt());
        notification.setUpdatedBy(entity.getUpdatedBy());
        notification.setDeleted(entity.getDeleted());
        notification.setDeletedAt(entity.getDeletedAt());
        notification.setDeletedBy(entity.getDeletedBy());
        if (entity.getUser() != null) {
            notification.setUserId(entity.getUser().getId());
        }
        return notification;
    }
}
