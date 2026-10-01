package com.example.backend.infrastructure.persistence.jpa.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Getter
@Setter
@Table(name = "slot_price_override", uniqueConstraints = @UniqueConstraint(columnNames = { "court_id", "date",
        "start_time" }))
public class SlotPriceOverrideEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "court_id")
    private CourtEntity court;

    private LocalDate date;

    @Column(name = "start_time")
    private LocalTime startTime;

    private Long overridePrice;
}
