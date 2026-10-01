package com.example.backend.core.entity.group;

import com.example.backend.core.enums.groups.InviteStatus;
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
public class GroupInvite {
    private Long id;
    private Long groupId;
    private String code;
    private Long createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime expiredAt;
    private InviteStatus status;
}
