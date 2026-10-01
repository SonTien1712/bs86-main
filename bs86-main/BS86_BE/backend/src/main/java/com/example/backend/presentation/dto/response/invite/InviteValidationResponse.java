package com.example.backend.presentation.dto.response.invite;

import com.example.backend.core.enums.groups.InviteStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class InviteValidationResponse {
    private String code;
    private Long groupId;
    private String groupName;
    private String groupDescription;
    private long memberCount;
    private String leaderEmail;
    private InviteStatus inviteStatus;
    private LocalDateTime expiredAt;
    private boolean alreadyMember;
}
