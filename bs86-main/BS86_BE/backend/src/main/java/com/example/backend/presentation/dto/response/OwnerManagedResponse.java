package com.example.backend.presentation.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class OwnerManagedResponse {
    private Long id;
    private Long ownerId;
    private String ownerEmail;
    private String ownerName;
    private String phoneNumber;
    private String status;
    private String reason;
    private int fieldCount;
    private LocalDateTime updatedAt;
}
