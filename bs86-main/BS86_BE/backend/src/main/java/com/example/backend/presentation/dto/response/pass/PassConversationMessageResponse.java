package com.example.backend.presentation.dto.response.pass;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class PassConversationMessageResponse {
    private Long id;
    private Long conversationId;
    private Long senderUserId;
    private String senderFullName;
    private String content;
    private LocalDateTime createdAt;
}
