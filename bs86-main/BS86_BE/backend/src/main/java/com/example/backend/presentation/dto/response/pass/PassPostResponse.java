package com.example.backend.presentation.dto.response.pass;

import com.example.backend.core.enums.PassPostStatus;
import com.example.backend.core.enums.PostCategory;
import com.example.backend.core.enums.TicketStatus;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Getter
@Builder
public class PassPostResponse {
    private Long id;
    private Long ticketId;
    private Long ownerUserId;
    private String ownerFullName;
    private PostCategory category;
    private PassPostStatus status;
    private TicketStatus ticketStatus;
    private String content;
    private BigDecimal askingPrice;
    private Long fieldId;
    private String fieldName;
    private String fieldAddress;
    private Long courtId;
    private String courtName;
    private LocalDate slotDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private LocalDateTime createdAt;
}
