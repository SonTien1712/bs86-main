package com.example.backend.core.entity.group;

import com.example.backend.core.enums.groups.GroupRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class GroupDetailSummary {
    private Group group;
    private GroupRole myRole;
    private long memberCount;
}
