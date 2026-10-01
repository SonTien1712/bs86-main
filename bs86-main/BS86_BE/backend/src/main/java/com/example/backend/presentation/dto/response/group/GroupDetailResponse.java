package com.example.backend.presentation.dto.response.group;

import com.example.backend.core.enums.groups.GroupRole;
import com.example.backend.core.enums.groups.GroupStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class GroupDetailResponse {
    private Long id;
    private String name;
    private String description;
    private Long leaderId;
    private GroupStatus status;
    private GroupRole myRole;
    private long memberCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
