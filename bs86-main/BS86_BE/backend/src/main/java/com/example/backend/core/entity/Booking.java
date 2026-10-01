package com.example.backend.core.entity;

import com.example.backend.core.enums.OrderStatus;
import com.example.backend.core.enums.PaymentStatus;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

// Booking.java
@Getter
@Setter
public class Booking extends AuditableEntity {
    private Long id;
    private Court court;
    private Long customerId;
    private User customer;
    private Long merchantId;
    private LocalDate bookingDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private OrderStatus  bookingStatus; // PENDING, CONFIRMED, CANCELLED, COMPLETED
    private PaymentStatus  paymentStatus; // PENDING, PAID, FAILED
    private Double totalAmount;
    private Double merchantRevenue;
    private Double platformCommission;
    private String paymentReference;
    private LocalDateTime expiresAt;
    private LocalDateTime createdAt;
    private String createdBy;
    private LocalDateTime updatedAt;
    private String updatedBy;
    private boolean deleted;
    private LocalDateTime deletedAt;
    private String deletedBy;
    private Long version;
    private OwnerProfile ownerProfile;
}
