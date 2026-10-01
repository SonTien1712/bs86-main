package com.example.backend.presentation.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class NotificationResponse {

    private Long id;
    private String title;
    private String message;
    private String type;
    private String eventCode;
    private boolean isRead;
    private LocalDateTime readAt;
    private String relatedEntityType;
    private Long relatedEntityId;
    private String actionUrl;
    private LocalDateTime createdAt;
}
