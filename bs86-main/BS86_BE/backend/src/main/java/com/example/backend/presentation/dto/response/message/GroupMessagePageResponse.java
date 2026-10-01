package com.example.backend.presentation.dto.response.message;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class GroupMessagePageResponse {
    private List<GroupMessageResponse> items;
    private Long nextBeforeMessageId;
    private boolean hasMore;
}
