package com.example.backend.core.entity.group;

import com.example.backend.core.enums.groups.GroupMemberStatus;
import com.example.backend.core.enums.groups.GroupRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GroupMember {
    private Long id;
    private Long groupId;
    private Long userId;
    private GroupRole role;
    private GroupMemberStatus status;
    private LocalDateTime joinedAt;
}
