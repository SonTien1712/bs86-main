package com.example.backend.presentation.dto.response.pass;

import com.example.backend.core.enums.PassConversationStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class PassConversationDetailResponse {
    private Long id;
    private Long passPostId;
    private Long ticketId;
    private PassConversationStatus status;
    private Long ownerUserId;
    private String ownerFullName;
    private Long interestedUserId;
    private String interestedUserFullName;
    private String fieldName;
    private String courtName;
    private String postContent;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<PassConversationMessageResponse> messages;
}
