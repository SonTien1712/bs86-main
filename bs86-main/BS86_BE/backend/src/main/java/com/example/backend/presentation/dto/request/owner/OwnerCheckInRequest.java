package com.example.backend.presentation.dto.request.owner;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class OwnerCheckInRequest {

    @NotBlank(message = "qrToken is required")
    private String qrToken;
}
