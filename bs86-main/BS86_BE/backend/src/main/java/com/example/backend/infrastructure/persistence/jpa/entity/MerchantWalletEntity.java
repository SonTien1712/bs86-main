package com.example.backend.infrastructure.persistence.jpa.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Entity
@Table(name = "merchant_wallets")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MerchantWalletEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "merchant_id", nullable = false, unique = true)
    private Long merchantId;

    @Column(name = "available_balance", nullable = false, precision = 19, scale = 2)
    private BigDecimal availableBalance = BigDecimal.ZERO;

    @Column(name = "frozen_balance", nullable = false, precision = 19, scale = 2)
    private BigDecimal frozenBalance = BigDecimal.ZERO;

    @Version
    @Column(name = "version")
    private Long version;

    @Column(name = "updated_at")
    private Long updatedAt;

    @PrePersist
    @PreUpdate
    public void onUpdate() {
        this.updatedAt = System.currentTimeMillis();
    }
}
