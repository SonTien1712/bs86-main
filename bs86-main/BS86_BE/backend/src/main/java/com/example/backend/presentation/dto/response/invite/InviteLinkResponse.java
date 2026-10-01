package com.example.backend.presentation.dto.response.invite;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class InviteLinkResponse {
    private String code;
    private String inviteLink;
    private LocalDateTime expiredAt;
}
