package com.example.backend.infrastructure.persistence.jpa.entity;

import com.example.backend.infrastructure.persistence.jpa.entity.AuditableEntity;
import com.example.backend.core.enums.OrderStatus;
import com.example.backend.core.enums.PaymentStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Getter
@Setter
@EntityListeners(AuditingEntityListener.class)
@Table(name = "bookings")
public class BookingEntity extends AuditableEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id")
    private UserEntity customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "court_id")
    private CourtEntity court;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "merchant_id")
    private OwnerProfileEntity ownerProfile;
    private LocalDate bookingDate;
    private LocalTime startTime;
    private LocalTime endTime;

    private BigDecimal totalAmount;
    private BigDecimal platformCommission;
    private BigDecimal merchantRevenue;

    @Enumerated(EnumType.STRING)
    private PaymentStatus paymentStatus;

    @Enumerated(EnumType.STRING)
    private OrderStatus bookingStatus;

    private String paymentReference;
    private LocalDateTime expiresAt;

    @Version
    private Long version;
}
