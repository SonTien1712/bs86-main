package com.example.backend.presentation.dto.request.ticket;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TicketCheckInRequest {

    @NotBlank(message = "qrToken is required")
    private String qrToken;
}
