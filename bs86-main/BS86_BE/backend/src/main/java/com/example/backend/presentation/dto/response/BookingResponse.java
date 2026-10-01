package com.example.backend.presentation.dto.response;

import com.example.backend.core.enums.OrderStatus;
import com.example.backend.core.enums.PaymentStatus;
import lombok.Builder;
import lombok.Data;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Getter
@Builder
@Data
public class BookingResponse {
    private String bookingCode;
    private Long id;
    private Long courtId;
    private Integer courtNumber;
    private Long fieldId;
    private String fieldName;
    private String sportType;
    private String location;
    private Long customerId;
    private Long merchantId;
    private LocalDate bookingDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private String bookingStatus;
    private String bookingStatusCode;
    private String paymentStatus;
    private String paymentMethod;
    private String transactionStatus;
    private Double totalAmount;
    private String paymentReference;
    private Long latestTransactionId;
    private String note;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime expiresAt;
    private LocalDateTime paidAt;
}
