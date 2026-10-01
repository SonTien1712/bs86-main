package com.example.backend.presentation.dto.response.group;

import com.example.backend.core.enums.groups.GroupRole;
import com.example.backend.core.enums.groups.GroupStatus;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class MyGroupItemResponse {
    private Long id;
    private String name;
    private String description;
    private long memberCount;
    private GroupRole myRole;
    private GroupStatus status;
}
