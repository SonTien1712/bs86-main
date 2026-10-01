package com.example.backend.infrastructure.persistence.jpa.entity;

import com.example.backend.core.enums.DayType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalTime;

@Getter
@Setter
@Entity
@Table(name = "time_slot_template")
public class TimeSlotTemplateEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "court_id")
    private CourtEntity court;

    @Enumerated(EnumType.STRING)
    private DayType dayType;

    private LocalTime openTime;
    private LocalTime closeTime;

    private int slotMinutes;

    private Long basePrice;
}
