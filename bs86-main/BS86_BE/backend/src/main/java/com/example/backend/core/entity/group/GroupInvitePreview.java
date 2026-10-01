package com.example.backend.core.entity.group;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class GroupInvitePreview {
    private GroupInvite invite;
    private Group group;
    private long memberCount;
    private String leaderEmail;
    private boolean alreadyMember;
}
