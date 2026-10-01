package com.example.backend.presentation.dto.response.owner;

import com.example.backend.core.enums.CheckInResult;
import com.example.backend.core.enums.TicketStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Getter
@Builder
public class OwnerCheckInResponse {
    private Long logId;
    private Long ticketId;
    private String ticketCode;
    private String qrToken;
    private String fieldName;
    private String courtName;
    private LocalDate slotDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private TicketStatus ticketStatus;
    private CheckInResult result;
    private String reason;
    private LocalDateTime checkInTime;
}
