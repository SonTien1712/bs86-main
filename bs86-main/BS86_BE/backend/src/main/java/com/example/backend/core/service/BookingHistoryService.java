package com.example.backend.core.service;

import com.example.backend.core.entity.Booking;
import com.example.backend.core.entity.Court;
import com.example.backend.core.entity.Field;
import com.example.backend.core.entity.User;
import com.example.backend.core.enums.OrderStatus;
import com.example.backend.core.repository.BookingRepository;
import com.example.backend.infrastructure.persistence.jpa.entity.TransactionEntity;
import com.example.backend.infrastructure.persistence.jpa.repository.TransactionJpaRepository;
import com.example.backend.presentation.dto.response.BookingHistoryItemResponse;
import com.example.backend.presentation.dto.response.BookingResponse;
import com.example.backend.presentation.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BookingHistoryService {

    private static final Map<OrderStatus, String> DISPLAY_STATUS = createDisplayStatusMap();

    private final BookingRepository bookingRepository;
    private final BookingService bookingService;
    private final CurrentUserService currentUserService;
    private final TransactionJpaRepository transactionJpaRepository;

    @Transactional(readOnly = true)
    public Page<BookingHistoryItemResponse> getMyHistory(String status, int page, int size) {
        User currentUser = currentUserService.getCurrentUser();
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        List<OrderStatus> statuses = parseStatuses(status);

        Page<Booking> bookings = statuses == null
                ? bookingRepository.findByCustomerId(currentUser.getId(), pageable)
                : bookingRepository.findByCustomerIdAndBookingStatusIn(currentUser.getId(), statuses, pageable);

        Map<Long, TransactionEntity> latestTransactions = getLatestTransactions(bookings.getContent());
        return bookings.map(booking -> toHistoryItem(booking, latestTransactions.get(booking.getId())));
    }

    @Transactional(readOnly = true)
    public BookingResponse getBookingDetail(Long bookingId) {
        Booking booking = bookingService.getBooking(bookingId);
        TransactionEntity latestTransaction = transactionJpaRepository.findTopByBooking_IdOrderByCreatedAtDesc(bookingId)
                .orElse(null);
        return toBookingResponse(booking, latestTransaction);
    }

    private Map<Long, TransactionEntity> getLatestTransactions(List<Booking> bookings) {
        List<Long> bookingIds = bookings.stream()
                .map(Booking::getId)
                .filter(Objects::nonNull)
                .toList();

        if (bookingIds.isEmpty()) {
            return Collections.emptyMap();
        }

        return transactionJpaRepository.findLatestByBookingIds(bookingIds).stream()
                .filter(transaction -> transaction.getBooking() != null && transaction.getBooking().getId() != null)
                .collect(Collectors.toMap(
                        transaction -> transaction.getBooking().getId(),
                        transaction -> transaction,
                        (left, right) -> {
                            LocalDateTime leftCreatedAt = left.getCreatedAt();
                            LocalDateTime rightCreatedAt = right.getCreatedAt();
                            if (leftCreatedAt == null) {
                                return right;
                            }
                            if (rightCreatedAt == null) {
                                return left;
                            }
                            return rightCreatedAt.isAfter(leftCreatedAt) ? right : left;
                        }
                ));
    }

    private List<OrderStatus> parseStatuses(String status) {
        if (status == null || status.isBlank() || "ALL".equalsIgnoreCase(status)) {
            return null;
        }

        return switch (status.trim().toUpperCase()) {
            case "PENDING" -> List.of(OrderStatus.PENDING, OrderStatus.PENDING_PAYMENT);
            case "CONFIRMED" -> List.of(OrderStatus.CONFIRMED);
            case "CANCELLED" -> List.of(OrderStatus.CANCELLED, OrderStatus.EXPIRED);
            case "COMPLETED" -> List.of(OrderStatus.COMPLETED);
            default -> throw new BusinessException(HttpStatus.BAD_REQUEST, "Invalid booking status filter: " + status);
        };
    }

    private BookingHistoryItemResponse toHistoryItem(Booking booking, TransactionEntity latestTransaction) {
        Court court = booking.getCourt();
        Field field = court != null ? court.getField() : null;

        return BookingHistoryItemResponse.builder()
                .id(booking.getId())
                .bookingCode(formatBookingCode(booking.getId()))
                .courtId(court != null ? court.getId() : null)
                .courtNumber(court != null ? court.getCourtNumber() : null)
                .fieldId(field != null ? field.getId() : null)
                .fieldName(field != null ? field.getName() : null)
                .sportType(field != null && field.getSportType() != null ? field.getSportType().name() : null)
                .location(field != null ? field.getAddress() : null)
                .bookingDate(booking.getBookingDate())
                .startTime(booking.getStartTime())
                .endTime(booking.getEndTime())
                .totalAmount(booking.getTotalAmount())
                .bookingStatus(normalizeBookingStatus(booking.getBookingStatus()))
                .bookingStatusCode(booking.getBookingStatus() != null ? booking.getBookingStatus().name() : null)
                .paymentStatus(booking.getPaymentStatus() != null ? booking.getPaymentStatus().name() : null)
                .paymentMethod(latestTransaction != null && latestTransaction.getPaymentMethod() != null
                        ? latestTransaction.getPaymentMethod().name()
                        : null)
                .transactionStatus(latestTransaction != null && latestTransaction.getStatus() != null
                        ? latestTransaction.getStatus().name()
                        : null)
                .paymentReference(resolvePaymentReference(booking, latestTransaction))
                .latestTransactionId(latestTransaction != null ? latestTransaction.getId() : null)
                .note(resolveNote(latestTransaction))
                .createdAt(booking.getCreatedAt())
                .paidAt(latestTransaction != null ? latestTransaction.getPaidAt() : null)
                .build();
    }

    private BookingResponse toBookingResponse(Booking booking, TransactionEntity latestTransaction) {
        Court court = booking.getCourt();
        Field field = court != null ? court.getField() : null;

        return BookingResponse.builder()
                .bookingCode(formatBookingCode(booking.getId()))
                .id(booking.getId())
                .courtId(court != null ? court.getId() : null)
                .courtNumber(court != null ? court.getCourtNumber() : null)
                .fieldId(field != null ? field.getId() : null)
                .fieldName(field != null ? field.getName() : null)
                .sportType(field != null && field.getSportType() != null ? field.getSportType().name() : null)
                .location(field != null ? field.getAddress() : null)
                .customerId(booking.getCustomerId())
                .merchantId(booking.getMerchantId())
                .bookingDate(booking.getBookingDate())
                .startTime(booking.getStartTime())
                .endTime(booking.getEndTime())
                .bookingStatus(normalizeBookingStatus(booking.getBookingStatus()))
                .bookingStatusCode(booking.getBookingStatus() != null ? booking.getBookingStatus().name() : null)
                .paymentStatus(booking.getPaymentStatus() != null ? booking.getPaymentStatus().name() : null)
                .paymentMethod(latestTransaction != null && latestTransaction.getPaymentMethod() != null
                        ? latestTransaction.getPaymentMethod().name()
                        : null)
                .transactionStatus(latestTransaction != null && latestTransaction.getStatus() != null
                        ? latestTransaction.getStatus().name()
                        : null)
                .totalAmount(booking.getTotalAmount())
                .paymentReference(resolvePaymentReference(booking, latestTransaction))
                .latestTransactionId(latestTransaction != null ? latestTransaction.getId() : null)
                .note(resolveNote(latestTransaction))
                .createdAt(booking.getCreatedAt())
                .updatedAt(booking.getUpdatedAt())
                .expiresAt(booking.getExpiresAt())
                .paidAt(latestTransaction != null ? latestTransaction.getPaidAt() : null)
                .build();
    }

    private String formatBookingCode(Long bookingId) {
        if (bookingId == null) {
            return null;
        }
        return "BK-" + String.format("%06d", bookingId);
    }

    private String normalizeBookingStatus(OrderStatus status) {
        if (status == null) {
            return null;
        }
        return DISPLAY_STATUS.getOrDefault(status, status.name());
    }

    private String resolvePaymentReference(Booking booking, TransactionEntity latestTransaction) {
        if (booking.getPaymentReference() != null && !booking.getPaymentReference().isBlank()) {
            return booking.getPaymentReference();
        }
        if (latestTransaction == null) {
            return null;
        }
        if (latestTransaction.getGatewayReference() != null && !latestTransaction.getGatewayReference().isBlank()) {
            return latestTransaction.getGatewayReference();
        }
        if (latestTransaction.getGatewayOrderCode() != null && !latestTransaction.getGatewayOrderCode().isBlank()) {
            return latestTransaction.getGatewayOrderCode();
        }
        return latestTransaction.getTransactionCode();
    }

    private String resolveNote(TransactionEntity latestTransaction) {
        if (latestTransaction == null) {
            return null;
        }
        if (latestTransaction.getDescription() != null && !latestTransaction.getDescription().isBlank()) {
            return latestTransaction.getDescription();
        }
        if (latestTransaction.getResponseMessage() != null && !latestTransaction.getResponseMessage().isBlank()) {
            return latestTransaction.getResponseMessage();
        }
        return latestTransaction.getFailReason();
    }

    private static Map<OrderStatus, String> createDisplayStatusMap() {
        Map<OrderStatus, String> mapping = new EnumMap<>(OrderStatus.class);
        mapping.put(OrderStatus.PENDING, "PENDING");
        mapping.put(OrderStatus.PENDING_PAYMENT, "PENDING");
        mapping.put(OrderStatus.CONFIRMED, "CONFIRMED");
        mapping.put(OrderStatus.CANCELLED, "CANCELLED");
        mapping.put(OrderStatus.EXPIRED, "CANCELLED");
        mapping.put(OrderStatus.COMPLETED, "COMPLETED");
        return mapping;
    }
}
