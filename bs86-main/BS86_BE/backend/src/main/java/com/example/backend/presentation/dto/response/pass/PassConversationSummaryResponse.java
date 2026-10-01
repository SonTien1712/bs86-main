package com.example.backend.presentation.dto.response.pass;

import com.example.backend.core.enums.PassConversationStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class PassConversationSummaryResponse {
    private Long id;
    private Long passPostId;
    private Long ticketId;
    private PassConversationStatus status;
    private Long ownerUserId;
    private String ownerFullName;
    private Long interestedUserId;
    private String interestedUserFullName;
    private Long counterpartUserId;
    private String counterpartFullName;
    private String fieldName;
    private String courtName;
    private LocalDateTime updatedAt;
    private LocalDateTime createdAt;
    private String lastMessagePreview;
    private LocalDateTime lastMessageAt;
}
