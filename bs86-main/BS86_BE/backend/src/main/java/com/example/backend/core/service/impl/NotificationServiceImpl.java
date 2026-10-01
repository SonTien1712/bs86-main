package com.example.backend.core.service.impl;

import com.example.backend.core.entity.Booking;
import com.example.backend.core.entity.Notification;
import com.example.backend.core.entity.OwnerProfile;
import com.example.backend.core.entity.User;
import com.example.backend.core.enums.NotificationEvent;
import com.example.backend.core.enums.NotificationType;
import com.example.backend.core.enums.OrderStatus;
import com.example.backend.core.enums.Role;
import com.example.backend.core.repository.NotificationRepository;
import com.example.backend.core.repository.OwnerProfileRepository;
import com.example.backend.core.repository.UserRepository;
import com.example.backend.core.service.NotificationService;
import com.example.backend.infrastructure.external.EmailService;
import com.example.backend.presentation.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationServiceImpl implements NotificationService {

    private static final DateTimeFormatter BOOKING_TIME_FORMAT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
    private static final String BOOKING_ENTITY = "BOOKING";

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final OwnerProfileRepository ownerProfileRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final EmailService emailService;

    @Value("${notification.email.enabled:false}")
    private boolean emailEnabled;

    @Override
    @Transactional(readOnly = true)
    public Page<Notification> getUserNotifications(Long userId, int page, int size, boolean unreadOnly) {
        return notificationRepository.findByUserId(userId, PageRequest.of(page, size), unreadOnly);
    }

    @Override
    @Transactional(readOnly = true)
    public long getUnreadCount(Long userId) {
        return notificationRepository.countUnreadByUserId(userId);
    }

    @Override
    @Transactional
    public Notification markAsRead(Long userId, Long notificationId) {
        Notification notification = notificationRepository.findByIdAndUserId(notificationId, userId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Notification not found"));

        if (!notification.isRead()) {
            notification.setRead(true);
            notification.setReadAt(LocalDateTime.now());
            notification = notificationRepository.save(notification);
        }

        return notification;
    }

    @Override
    @Transactional
    public int markAllAsRead(Long userId) {
        return notificationRepository.markAllAsRead(userId, LocalDateTime.now());
    }

    @Override
    @Transactional
    public Notification createNotification(
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
    ) {
        if (userId == null) {
            return null;
        }

        if (dedupKey != null && !dedupKey.isBlank() && notificationRepository.existsByDedupKey(dedupKey)) {
            return null;
        }

        Notification notification = new Notification();
        notification.setUserId(userId);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setType(type);
        notification.setEventCode(eventCode);
        notification.setRead(false);
        notification.setRelatedEntityType(relatedEntityType);
        notification.setRelatedEntityId(relatedEntityId);
        notification.setActionUrl(actionUrl);
        notification.setMetadataJson(metadataJson);
        notification.setDedupKey(dedupKey);

        Notification saved = notificationRepository.save(notification);
        publishRealtime(saved);
        return saved;
    }

    @Override
    @Transactional
    public void notifyBookingCreated(Booking booking) {
        if (booking == null || booking.getId() == null) {
            return;
        }

        String actionUrl = bookingActionUrl(booking.getId());
        String bookingLabel = bookingLabel(booking);
        String metadata = "{\"bookingStatus\":\"%s\",\"paymentStatus\":\"%s\"}".formatted(
                safeEnumName(booking.getBookingStatus()),
                safeEnumName(booking.getPaymentStatus())
        );

        createNotification(
                booking.getCustomerId(),
                NotificationType.BOOKING,
                NotificationEvent.BOOKING_CREATED,
                "Dat san thanh cong",
                "Yeu cau dat san %s da duoc tao va dang cho xu ly.".formatted(bookingLabel),
                BOOKING_ENTITY,
                booking.getId(),
                actionUrl,
                metadata,
                null
        );

        resolveOwnerUserId(booking).ifPresent(ownerUserId -> createNotification(
                ownerUserId,
                NotificationType.BOOKING,
                NotificationEvent.OWNER_NEW_BOOKING,
                "Co booking moi",
                "Ban vua nhan duoc booking moi cho %s.".formatted(bookingLabel),
                BOOKING_ENTITY,
                booking.getId(),
                actionUrl,
                metadata,
                null
        ));
    }

    @Override
    @Transactional
    public void notifyBookingStatusChanged(Booking booking, OrderStatus previousStatus, OrderStatus newStatus) {
        if (booking == null || newStatus == null || previousStatus == newStatus) {
            return;
        }

        if (newStatus == OrderStatus.CONFIRMED) {
            String actionUrl = bookingActionUrl(booking.getId());
            String bookingLabel = bookingLabel(booking);

            createNotification(
                    booking.getCustomerId(),
                    NotificationType.BOOKING,
                    NotificationEvent.BOOKING_CONFIRMED,
                    "Booking da duoc xac nhan",
                    "Booking %s da duoc xac nhan.".formatted(bookingLabel),
                    BOOKING_ENTITY,
                    booking.getId(),
                    actionUrl,
                    "{\"bookingStatus\":\"CONFIRMED\"}",
                    null
            );

            sendEmailIfEnabled(
                    resolveCustomerEmail(booking).orElse(null),
                    "Booking confirmed",
                    """
                    Booking cua ban da duoc xac nhan.

                    Ma booking: #%s
                    Khung gio: %s
                    """.formatted(booking.getId(), bookingLabel)
            );
        } else if (newStatus == OrderStatus.CANCELLED) {
            notifyBookingCancelled(booking, "Status updated to CANCELLED", false);
        }
    }

    @Override
    @Transactional
    public void notifyBookingCancelled(Booking booking, String reason, boolean cancelledByCustomer) {
        if (booking == null || booking.getId() == null) {
            return;
        }

        String actionUrl = bookingActionUrl(booking.getId());
        String bookingLabel = bookingLabel(booking);
        String metadata = "{\"reason\":\"%s\"}".formatted(sanitizeJson(reason));

        createNotification(
                booking.getCustomerId(),
                NotificationType.BOOKING,
                NotificationEvent.BOOKING_CANCELLED,
                cancelledByCustomer ? "Ban da huy booking" : "Booking da bi huy",
                cancelledByCustomer
                        ? "Booking %s da duoc huy thanh cong.".formatted(bookingLabel)
                        : "Booking %s da bi huy. %s".formatted(bookingLabel, fallbackReason(reason)),
                BOOKING_ENTITY,
                booking.getId(),
                actionUrl,
                metadata,
                null
        );

        resolveOwnerUserId(booking).ifPresent(ownerUserId -> createNotification(
                ownerUserId,
                NotificationType.BOOKING,
                NotificationEvent.OWNER_BOOKING_CANCELLED,
                cancelledByCustomer ? "Nguoi dung da huy booking" : "Booking da bi huy",
                cancelledByCustomer
                        ? "Nguoi dung vua huy %s.".formatted(bookingLabel)
                        : "Booking %s da bi huy.".formatted(bookingLabel),
                BOOKING_ENTITY,
                booking.getId(),
                actionUrl,
                metadata,
                null
        ));

        sendEmailIfEnabled(
                resolveCustomerEmail(booking).orElse(null),
                "Booking cancelled",
                """
                Booking cua ban da bi huy.

                Ma booking: #%s
                Ly do: %s
                """.formatted(booking.getId(), fallbackReason(reason))
        );
    }

    @Override
    @Transactional
    public void notifyPaymentSuccess(Booking booking) {
        if (booking == null || booking.getId() == null) {
            return;
        }

        String actionUrl = bookingActionUrl(booking.getId());
        String bookingLabel = bookingLabel(booking);
        String metadata = "{\"paymentReference\":\"%s\"}".formatted(sanitizeJson(booking.getPaymentReference()));

        createNotification(
                booking.getCustomerId(),
                NotificationType.PAYMENT,
                NotificationEvent.PAYMENT_SUCCESS,
                "Thanh toan thanh cong",
                "Thanh toan cho %s da thanh cong.".formatted(bookingLabel),
                BOOKING_ENTITY,
                booking.getId(),
                actionUrl,
                metadata,
                null
        );

        resolveOwnerUserId(booking).ifPresent(ownerUserId -> createNotification(
                ownerUserId,
                NotificationType.PAYMENT,
                NotificationEvent.PAYMENT_SUCCESS,
                "Khach da thanh toan thanh cong",
                "Booking %s da thanh toan thanh cong.".formatted(bookingLabel),
                BOOKING_ENTITY,
                booking.getId(),
                actionUrl,
                metadata,
                null
        ));

        sendEmailIfEnabled(
                resolveCustomerEmail(booking).orElse(null),
                "Payment success",
                """
                Thanh toan cho booking cua ban da thanh cong.

                Ma booking: #%s
                Khung gio: %s
                """.formatted(booking.getId(), bookingLabel)
        );
    }

    @Override
    @Transactional
    public void notifyPaymentFailure(Booking booking, String reason) {
        if (booking == null || booking.getId() == null) {
            return;
        }

        String actionUrl = bookingActionUrl(booking.getId());
        String bookingLabel = bookingLabel(booking);
        String metadata = "{\"reason\":\"%s\"}".formatted(sanitizeJson(reason));

        createNotification(
                booking.getCustomerId(),
                NotificationType.PAYMENT,
                NotificationEvent.PAYMENT_FAILED,
                "Thanh toan that bai",
                "Thanh toan cho %s that bai. %s".formatted(bookingLabel, fallbackReason(reason)),
                BOOKING_ENTITY,
                booking.getId(),
                actionUrl,
                metadata,
                null
        );

        notifyAdmins(
                NotificationType.ADMIN_ALERT,
                NotificationEvent.ADMIN_PAYMENT_ALERT,
                "Canh bao loi thanh toan",
                "Booking #%s gap loi thanh toan. %s".formatted(booking.getId(), fallbackReason(reason)),
                actionUrl,
                metadata
        );
    }

    @Override
    @Transactional
    public void notifyPaymentExpired(Booking booking) {
        if (booking == null || booking.getId() == null) {
            return;
        }

        String actionUrl = bookingActionUrl(booking.getId());

        createNotification(
                booking.getCustomerId(),
                NotificationType.PAYMENT,
                NotificationEvent.PAYMENT_EXPIRED,
                "Phien thanh toan het han",
                "Phien thanh toan cho booking #%s da het han.".formatted(booking.getId()),
                BOOKING_ENTITY,
                booking.getId(),
                actionUrl,
                "{\"status\":\"EXPIRED\"}",
                null
        );

        notifyAdmins(
                NotificationType.ADMIN_ALERT,
                NotificationEvent.ADMIN_PAYMENT_ALERT,
                "Booking het han thanh toan",
                "Booking #%s da het han thanh toan va duoc giai phong slot.".formatted(booking.getId()),
                actionUrl,
                "{\"status\":\"EXPIRED\"}"
        );
    }

    @Override
    @Transactional
    public void notifyUpcomingBookingReminder(Booking booking) {
        if (booking == null || booking.getId() == null) {
            return;
        }

        LocalDateTime startAt = bookingStartAt(booking);
        if (startAt == null) {
            return;
        }

        String dedupKey = "booking-reminder:%s:%s".formatted(booking.getId(), startAt);
        createNotification(
                booking.getCustomerId(),
                NotificationType.REMINDER,
                NotificationEvent.BOOKING_REMINDER,
                "Sap den gio choi",
                "Booking #%s se bat dau luc %s.".formatted(
                        booking.getId(),
                        startAt.format(BOOKING_TIME_FORMAT)
                ),
                BOOKING_ENTITY,
                booking.getId(),
                bookingActionUrl(booking.getId()),
                "{\"startAt\":\"%s\"}".formatted(startAt),
                dedupKey
        );
    }

    @Override
    @Transactional
    public void notifyNewUserRegistered(User user) {
        if (user == null || user.getId() == null) {
            return;
        }

        String primaryRole = user.getRoles() == null || user.getRoles().isEmpty()
                ? "UNKNOWN"
                : user.getRoles().iterator().next().getRole().name();

        notifyAdmins(
                NotificationType.SYSTEM,
                NotificationEvent.ADMIN_NEW_USER,
                "Co user moi",
                "Tai khoan %s vua dang ky voi vai tro %s.".formatted(user.getEmail(), primaryRole),
                "/admin",
                "{\"userId\":%s,\"role\":\"%s\"}".formatted(user.getId(), primaryRole)
        );
    }

    private void notifyAdmins(
            NotificationType type,
            NotificationEvent eventCode,
            String title,
            String message,
            String actionUrl,
            String metadataJson
    ) {
        List<User> admins = userRepository.findAllByRole(Role.ADMIN);
        for (User admin : admins) {
            createNotification(
                    admin.getId(),
                    type,
                    eventCode,
                    title,
                    message,
                    null,
                    null,
                    actionUrl,
                    metadataJson,
                    null
            );
        }
    }

    private void publishRealtime(Notification notification) {
        if (notification == null || notification.getUserId() == null) {
            return;
        }

        userRepository.findById(notification.getUserId()).ifPresent(user -> {
            try {
                messagingTemplate.convertAndSendToUser(
                        user.getEmail(),
                        "/queue/notifications",
                        toSocketPayload(notification)
                );
            } catch (Exception ex) {
                log.warn("Could not publish notification {} to websocket user {}", notification.getId(), user.getEmail(), ex);
            }
        });
    }

    private Map<String, Object> toSocketPayload(Notification notification) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("id", notification.getId());
        payload.put("title", notification.getTitle());
        payload.put("message", notification.getMessage());
        payload.put("type", notification.getType() != null ? notification.getType().name() : null);
        payload.put("eventCode", notification.getEventCode() != null ? notification.getEventCode().name() : null);
        payload.put("isRead", notification.isRead());
        payload.put("readAt", notification.getReadAt());
        payload.put("relatedEntityType", notification.getRelatedEntityType());
        payload.put("relatedEntityId", notification.getRelatedEntityId());
        payload.put("actionUrl", notification.getActionUrl());
        payload.put("createdAt", notification.getCreatedAt());
        return payload;
    }

    private Optional<Long> resolveOwnerUserId(Booking booking) {
        if (booking.getOwnerProfile() != null
                && booking.getOwnerProfile().getUser() != null
                && booking.getOwnerProfile().getUser().getId() != null) {
            return Optional.of(booking.getOwnerProfile().getUser().getId());
        }

        if (booking.getMerchantId() == null) {
            return Optional.empty();
        }

        return ownerProfileRepository.findById(booking.getMerchantId())
                .map(OwnerProfile::getUser)
                .map(User::getId);
    }

    private Optional<String> resolveCustomerEmail(Booking booking) {
        if (booking.getCustomer() != null && booking.getCustomer().getEmail() != null) {
            return Optional.of(booking.getCustomer().getEmail());
        }
        if (booking.getCustomerId() == null) {
            return Optional.empty();
        }
        return userRepository.findById(booking.getCustomerId()).map(User::getEmail);
    }

    private LocalDateTime bookingStartAt(Booking booking) {
        if (booking.getBookingDate() == null || booking.getStartTime() == null) {
            return null;
        }
        return LocalDateTime.of(booking.getBookingDate(), booking.getStartTime());
    }

    private String bookingActionUrl(Long bookingId) {
        return bookingId == null ? "/account" : "/bookings/" + bookingId;
    }

    private String bookingLabel(Booking booking) {
        LocalDateTime startAt = bookingStartAt(booking);
        String time = startAt != null ? startAt.format(BOOKING_TIME_FORMAT) : "khong ro thoi gian";
        String courtName = booking.getCourt() != null && booking.getCourt().getCourtNumber() != null
                ? "San " + booking.getCourt().getCourtNumber()
                : "booking #" + booking.getId();
        String fieldName = booking.getCourt() != null
                && booking.getCourt().getField() != null
                && booking.getCourt().getField().getName() != null
                ? " - " + booking.getCourt().getField().getName()
                : "";
        return "%s%s luc %s".formatted(courtName, fieldName, time);
    }

    private String safeEnumName(Enum<?> value) {
        return value != null ? value.name() : "";
    }

    private String fallbackReason(String reason) {
        return (reason == null || reason.isBlank()) ? "Vui long kiem tra lai chi tiet booking." : reason;
    }

    private String sanitizeJson(String value) {
        if (value == null) {
            return "";
        }
        return value.replace("\\", "\\\\").replace("\"", "\\\"");
    }

    private void sendEmailIfEnabled(String to, String subject, String body) {
        if (!emailEnabled || to == null || to.isBlank()) {
            return;
        }

        try {
            emailService.sendSimpleEmail(to, subject, body);
        } catch (Exception ex) {
            log.warn("Could not send notification email to {}", to, ex);
        }
    }
}
