package com.example.backend.infrastructure.persistence.jpa.entity;

import com.example.backend.core.enums.CheckInResult;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Getter
@Setter
@Table(name = "check_in_logs")
public class CheckInLogEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ticket_id")
    private TicketEntity ticket;

    @Column(name = "ticket_id_snapshot")
    private Long ticketIdSnapshot;

    @Column(name = "ticket_code_snapshot", length = 64)
    private String ticketCodeSnapshot;

    @Column(name = "field_name_snapshot", length = 255)
    private String fieldNameSnapshot;

    @Column(name = "court_name_snapshot", length = 255)
    private String courtNameSnapshot;

    @Column(name = "slot_date_snapshot")
    private LocalDate slotDateSnapshot;

    @Column(name = "start_time_snapshot")
    private LocalTime startTimeSnapshot;

    @Column(name = "end_time_snapshot")
    private LocalTime endTimeSnapshot;

    @Column(nullable = false, length = 128)
    private String qrToken;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private UserEntity owner;

    @Column(nullable = false)
    private LocalDateTime checkInTime;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private CheckInResult result;

    @Column(length = 500)
    private String reason;
}
