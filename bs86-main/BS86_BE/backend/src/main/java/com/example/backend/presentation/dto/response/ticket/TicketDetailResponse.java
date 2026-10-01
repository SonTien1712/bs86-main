package com.example.backend.presentation.dto.response.ticket;

import com.example.backend.core.enums.TicketStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Getter
@Builder
public class TicketDetailResponse {
    private Long ticketId;
    private String ticketCode;
    private String qrToken;
    private String qrContent;
    private TicketStatus ticketStatus;
    private Long bookingId;
    private Long transactionId;
    private String orderCode;
    private Long fieldId;
    private String fieldName;
    private String fieldAddress;
    private Long courtId;
    private String courtName;
    private Integer courtNumber;
    private LocalDate slotDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private LocalDateTime validFrom;
    private LocalDateTime validUntil;
    private LocalDateTime issuedAt;
    private LocalDateTime checkedInAt;
    private TicketOwnerResponse owner;
    private String displayNote;
}
