package com.example.backend.infrastructure.persistence.jpa.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "finance_settings")
@Getter
@Setter
public class FinanceSettingsEntity {

    @Id
    private Long id;

    @Column(nullable = false, precision = 5, scale = 4)
    private BigDecimal platformCommissionRate;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal minimumPayoutAmount;
}
