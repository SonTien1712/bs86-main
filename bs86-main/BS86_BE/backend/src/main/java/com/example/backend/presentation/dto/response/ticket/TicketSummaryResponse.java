package com.example.backend.presentation.dto.response.ticket;

import com.example.backend.core.enums.TicketStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Getter
@Builder
public class TicketSummaryResponse {
    private Long ticketId;
    private String ticketCode;
    private TicketStatus ticketStatus;
    private Long fieldId;
    private String fieldName;
    private Long courtId;
    private String courtName;
    private LocalDate slotDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private LocalDateTime validFrom;
    private LocalDateTime validUntil;
}
