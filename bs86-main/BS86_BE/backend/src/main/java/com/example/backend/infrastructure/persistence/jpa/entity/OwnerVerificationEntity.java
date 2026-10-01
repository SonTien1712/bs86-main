package com.example.backend.infrastructure.persistence.jpa.entity;

import com.example.backend.core.enums.VerificationStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "owner_verifications")
@Getter
@Setter
public class OwnerVerificationEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false, unique = true)
    private OwnerProfileEntity owner;

    private String idCardNumber;

    private String idCardFrontUrl;

    private String idCardBackUrl;

    private String businessLicenseUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private VerificationStatus status;

    @Column(length = 1000)
    private String rejectionReason;

    private LocalDateTime rejectedAt;

    /** 1 = first submission (registration), 2 = first resubmit, 3 = last chance */
    @Column(name = "attempt_count", nullable = false)
    private int attemptCount;
}