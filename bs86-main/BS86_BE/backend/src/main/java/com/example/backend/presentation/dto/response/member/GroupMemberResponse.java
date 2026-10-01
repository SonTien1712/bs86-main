package com.example.backend.presentation.dto.response.member;

import com.example.backend.core.enums.groups.GroupMemberStatus;
import com.example.backend.core.enums.groups.GroupRole;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class GroupMemberResponse {
    private Long userId;
    private String userEmail;
    private GroupRole role;
    private GroupMemberStatus status;
    private LocalDateTime joinedAt;
}
