package com.example.backend.presentation.controller;

import com.example.backend.core.entity.Notification;
import com.example.backend.core.service.CurrentUserService;
import com.example.backend.core.service.NotificationService;
import com.example.backend.presentation.dto.response.ApiResponse;
import com.example.backend.presentation.dto.response.NotificationPageResponse;
import com.example.backend.presentation.dto.response.NotificationResponse;
import com.example.backend.presentation.dto.response.UnreadCountResponse;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Positive;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Validated
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final CurrentUserService currentUserService;

    @GetMapping
    public ApiResponse<NotificationPageResponse> getNotifications(
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) @Max(50) int size,
            @RequestParam(defaultValue = "false") boolean unreadOnly
    ) {
        Long userId = currentUserService.getCurrentUser().getId();
        Page<Notification> result = notificationService.getUserNotifications(userId, page, size, unreadOnly);

        NotificationPageResponse response = NotificationPageResponse.builder()
                .items(result.getContent().stream().map(this::toResponse).toList())
                .page(result.getNumber())
                .size(result.getSize())
                .totalPages(result.getTotalPages())
                .totalElements(result.getTotalElements())
                .hasNext(result.hasNext())
                .build();

        return new ApiResponse<>("Notifications retrieved", response);
    }

    @GetMapping("/unread-count")
    public ApiResponse<UnreadCountResponse> getUnreadCount() {
        Long userId = currentUserService.getCurrentUser().getId();
        long unreadCount = notificationService.getUnreadCount(userId);
        return new ApiResponse<>("Unread count retrieved", new UnreadCountResponse(unreadCount));
    }

    @PatchMapping("/{id}/read")
    public ApiResponse<NotificationResponse> markAsRead(@PathVariable @Positive Long id) {
        Long userId = currentUserService.getCurrentUser().getId();
        Notification notification = notificationService.markAsRead(userId, id);
        return new ApiResponse<>("Notification marked as read", toResponse(notification));
    }

    @PatchMapping("/read-all")
    public ApiResponse<UnreadCountResponse> markAllAsRead() {
        Long userId = currentUserService.getCurrentUser().getId();
        notificationService.markAllAsRead(userId);
        return new ApiResponse<>("All notifications marked as read", new UnreadCountResponse(0));
    }

    private NotificationResponse toResponse(Notification notification) {
        return NotificationResponse.builder()
                .id(notification.getId())
                .title(notification.getTitle())
                .message(notification.getMessage())
                .type(notification.getType() != null ? notification.getType().name() : null)
                .eventCode(notification.getEventCode() != null ? notification.getEventCode().name() : null)
                .isRead(notification.isRead())
                .readAt(notification.getReadAt())
                .relatedEntityType(notification.getRelatedEntityType())
                .relatedEntityId(notification.getRelatedEntityId())
                .actionUrl(notification.getActionUrl())
                .createdAt(notification.getCreatedAt())
                .build();
    }
}
