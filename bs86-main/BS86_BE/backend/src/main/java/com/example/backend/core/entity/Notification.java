package com.example.backend.core.entity;

import com.example.backend.core.enums.NotificationEvent;
import com.example.backend.core.enums.NotificationType;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class Notification extends AuditableEntity {

    private Long id;
    private Long userId;
    private User user;
    private String title;
    private String message;
    private NotificationType type;
    private NotificationEvent eventCode;
    private boolean read;
    private LocalDateTime readAt;
    private String relatedEntityType;
    private Long relatedEntityId;
    private String actionUrl;
    private String metadataJson;
    private String dedupKey;
}
