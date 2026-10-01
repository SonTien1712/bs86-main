package com.example.backend.presentation.dto.response.message;

import com.example.backend.core.enums.groups.MessageType;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class GroupMessageResponse {
    private Long id;
    private Long groupId;
    private Long senderId;
    private String senderEmail;
    private String content;
    private MessageType messageType;
    private LocalDateTime createdAt;
}
