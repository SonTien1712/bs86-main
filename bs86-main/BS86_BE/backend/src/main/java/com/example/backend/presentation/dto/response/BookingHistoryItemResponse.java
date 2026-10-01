package com.example.backend.presentation.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
@Builder
public class BookingHistoryItemResponse {
    private Long id;
    private String bookingCode;
    private Long courtId;
    private Integer courtNumber;
    private Long fieldId;
    private String fieldName;
    private String sportType;
    private String location;
    private LocalDate bookingDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private Double totalAmount;
    private String bookingStatus;
    private String bookingStatusCode;
    private String paymentStatus;
    private String paymentMethod;
    private String transactionStatus;
    private String paymentReference;
    private Long latestTransactionId;
    private String note;
    private LocalDateTime createdAt;
    private LocalDateTime paidAt;
}
