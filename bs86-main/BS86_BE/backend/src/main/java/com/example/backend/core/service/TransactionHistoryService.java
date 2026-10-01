package com.example.backend.core.service;

import com.example.backend.core.entity.OwnerProfile;
import com.example.backend.core.entity.User;
import com.example.backend.core.enums.Role;
import com.example.backend.core.enums.TransactionStatus;
import com.example.backend.infrastructure.persistence.jpa.entity.BookingEntity;
import com.example.backend.infrastructure.persistence.jpa.entity.TransactionEntity;
import com.example.backend.infrastructure.persistence.jpa.repository.TransactionJpaRepository;
import com.example.backend.presentation.dto.response.TransactionDetailResponse;
import com.example.backend.presentation.dto.response.TransactionHistoryItemResponse;
import com.example.backend.presentation.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class TransactionHistoryService {

    private final TransactionJpaRepository transactionJpaRepository;
    private final CurrentUserService currentUserService;
    private final com.example.backend.core.repository.OwnerProfileRepository ownerProfileRepository;

    @Transactional(readOnly = true)
    public Page<TransactionHistoryItemResponse> getMyHistory(String status, int page, int size) {
        User currentUser = currentUserService.getCurrentUser();
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        TransactionStatus transactionStatus = parseStatus(status);

        Page<TransactionEntity> transactions = transactionStatus == null
                ? transactionJpaRepository.findByUserIdOrderByCreatedAtDesc(currentUser.getId(), pageable)
                : transactionJpaRepository.findByUserIdAndStatusOrderByCreatedAtDesc(currentUser.getId(), transactionStatus, pageable);

        return transactions.map(this::toHistoryItem);
    }

    @Transactional(readOnly = true)
    public Page<TransactionHistoryItemResponse> getAdminTransactions(
            String status,
            Long fieldId,
            Long userId,
            LocalDate fromDate,
            LocalDate toDate,
            int page,
            int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return transactionJpaRepository.searchAll(
                parseStatus(status),
                fieldId,
                userId,
                fromDate != null ? fromDate.atStartOfDay() : null,
                toDate != null ? toDate.atTime(23, 59, 59) : null,
                pageable
        ).map(this::toHistoryItem);
    }

    @Transactional(readOnly = true)
    public Page<TransactionHistoryItemResponse> getOwnerTransactions(
            String status,
            Long fieldId,
            Long userId,
            LocalDate fromDate,
            LocalDate toDate,
            int page,
            int size
    ) {
        User currentUser = currentUserService.getCurrentUser();
        OwnerProfile ownerProfile = ownerProfileRepository.findByUserId(currentUser.getId())
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Owner profile not found"));

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return transactionJpaRepository.searchByOwner(
                ownerProfile.getId(),
                parseStatus(status),
                fieldId,
                userId,
                fromDate != null ? fromDate.atStartOfDay() : null,
                toDate != null ? toDate.atTime(23, 59, 59) : null,
                pageable
        ).map(this::toHistoryItem);
    }

    @Transactional(readOnly = true)
    public TransactionDetailResponse getTransactionDetail(Long transactionId) {
        User currentUser = currentUserService.getCurrentUser();
        TransactionEntity transaction = transactionJpaRepository.findById(transactionId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Transaction not found"));

        if (!canAccessTransaction(transaction, currentUser)) {
            throw new BusinessException(HttpStatus.FORBIDDEN, "You cannot view this transaction");
        }

        return toDetail(transaction);
    }

    private boolean canAccessTransaction(TransactionEntity transaction, User currentUser) {
        if (hasRole(currentUser, Role.ADMIN)) {
            return true;
        }
        if (transaction.getUserId() != null && transaction.getUserId().equals(currentUser.getId())) {
            return true;
        }
        if (hasRole(currentUser, Role.OWNER)) {
            Long ownerProfileId = ownerProfileRepository.findByUserId(currentUser.getId())
                    .map(OwnerProfile::getId)
                    .orElse(null);
            return ownerProfileId != null && ownerProfileId.equals(transaction.getOwnerProfileId());
        }
        return false;
    }

    private boolean hasRole(User user, Role role) {
        return user.getRoles() != null
                && user.getRoles().stream().anyMatch(userRole -> userRole.getRole() == role);
    }

    private TransactionStatus parseStatus(String status) {
        if (status == null || status.isBlank()) {
            return null;
        }

        try {
            return TransactionStatus.valueOf(status.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Invalid transaction status: " + status);
        }
    }

    private TransactionHistoryItemResponse toHistoryItem(TransactionEntity transaction) {
        BookingEntity booking = transaction.getBooking();
        return TransactionHistoryItemResponse.builder()
                .id(transaction.getId())
                .bookingId(booking != null ? booking.getId() : null)
                .userId(transaction.getUserId())
                .fieldId(transaction.getFieldId())
                .courtId(transaction.getCourtId())
                .slotDate(transaction.getSlotDate())
                .startTime(transaction.getStartTime())
                .endTime(transaction.getEndTime())
                .amount(transaction.getAmount())
                .paymentMethod(transaction.getPaymentMethod() != null ? transaction.getPaymentMethod().name() : null)
                .paymentStatus(transaction.getStatus() != null ? transaction.getStatus().name() : null)
                .bookingStatus(booking != null && booking.getBookingStatus() != null ? booking.getBookingStatus().name() : null)
                .createdAt(transaction.getCreatedAt())
                .paidAt(transaction.getPaidAt())
                .orderCode(transaction.getGatewayOrderCode() != null ? transaction.getGatewayOrderCode() : transaction.getTransactionCode())
                .gatewayTransactionId(transaction.getGatewayTransactionId())
                .message(transaction.getResponseMessage() != null ? transaction.getResponseMessage() : transaction.getDescription())
                .failReason(transaction.getFailReason())
                .build();
    }

    private TransactionDetailResponse toDetail(TransactionEntity transaction) {
        BookingEntity booking = transaction.getBooking();
        return TransactionDetailResponse.builder()
                .id(transaction.getId())
                .bookingId(booking != null ? booking.getId() : null)
                .userId(transaction.getUserId())
                .ownerProfileId(transaction.getOwnerProfileId())
                .fieldId(transaction.getFieldId())
                .courtId(transaction.getCourtId())
                .slotDate(transaction.getSlotDate())
                .startTime(transaction.getStartTime())
                .endTime(transaction.getEndTime())
                .amount(transaction.getAmount())
                .paymentMethod(transaction.getPaymentMethod() != null ? transaction.getPaymentMethod().name() : null)
                .transactionStatus(transaction.getStatus() != null ? transaction.getStatus().name() : null)
                .bookingStatus(booking != null && booking.getBookingStatus() != null ? booking.getBookingStatus().name() : null)
                .paymentStatus(booking != null && booking.getPaymentStatus() != null ? booking.getPaymentStatus().name() : null)
                .transactionCode(transaction.getTransactionCode())
                .gatewayOrderCode(transaction.getGatewayOrderCode())
                .gatewayTransactionId(transaction.getGatewayTransactionId())
                .gatewayReference(transaction.getGatewayReference())
                .paymentUrl(transaction.getPaymentUrl())
                .responseCode(transaction.getResponseCode())
                .responseMessage(transaction.getResponseMessage())
                .failReason(transaction.getFailReason())
                .createdAt(transaction.getCreatedAt())
                .updatedAt(transaction.getUpdatedAt())
                .paidAt(transaction.getPaidAt())
                .build();
    }
}
