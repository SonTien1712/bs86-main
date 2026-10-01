package com.example.backend.infrastructure.persistence.jpa.entity;

import com.example.backend.core.enums.PaymentMethod;
import com.example.backend.core.enums.TransactionStatus;
import com.example.backend.core.enums.TransactionType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Getter
@Setter
@Table(name = "transactions")
@EntityListeners(AuditingEntityListener.class)
public class TransactionEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id")
    private BookingEntity booking;

    private Long userId;
    private Long ownerProfileId;
    private Long fieldId;
    private Long courtId;
    private LocalDate slotDate;
    private LocalTime startTime;
    private LocalTime endTime;

    @Column(unique = true, nullable = false)
    private String transactionCode;

    private String gatewayOrderCode;

    @Enumerated(EnumType.STRING)
    private TransactionType transactionType;

    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    private PaymentMethod paymentMethod;

    @Enumerated(EnumType.STRING)
    private TransactionStatus status;

    @Column(length = 1000)
    private String paymentUrl;
    private String bankCode;
    private String gatewayTransactionId;
    private String gatewayReference;
    private String responseCode;
    private String responseMessage;
    private String failReason;
    private String description;
    private LocalDateTime paidAt;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        if (updatedAt == null) {
            updatedAt = LocalDateTime.now();
        }
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
