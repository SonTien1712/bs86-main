package com.example.backend.core.factory;

import com.example.backend.core.entity.group.GroupInvite;
import com.example.backend.core.enums.groups.InviteStatus;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
public class GroupInviteFactory {

    public GroupInvite create(Long groupId, Long createdBy, String code) {
        LocalDateTime now = LocalDateTime.now();

        return GroupInvite.builder()
                .groupId(groupId)
                .createdBy(createdBy)
                .code(code)
                .createdAt(now)
                .expiredAt(now.plusMinutes(10))
                .status(InviteStatus.ACTIVE)
                .build();
    }
}
