package com.example.backend.presentation.dto.request.pass;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class CreatePassPostRequest {

    @NotNull(message = "ticketId is required")
    private Long ticketId;

    @Size(max = 2000, message = "content must not exceed 2000 characters")
    private String content;

    private BigDecimal askingPrice;
}
