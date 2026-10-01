package com.example.backend.presentation.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UpdateCourtStatusRequest {
    @NotBlank
    private String status;
}
