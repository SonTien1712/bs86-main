package com.example.backend.presentation.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class NotificationPageResponse {

    private List<NotificationResponse> items;
    private int page;
    private int size;
    private int totalPages;
    private long totalElements;
    private boolean hasNext;
}
