package com.example.backend.presentation.dto.response.ticket;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class TicketOwnerResponse {
    private Long userId;
    private String fullName;
    private String phoneNumber;
    private String email;
}
