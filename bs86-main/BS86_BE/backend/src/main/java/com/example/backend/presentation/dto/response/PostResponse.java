package com.example.backend.presentation.dto.response;

import com.example.backend.core.enums.PostCategory;
import com.example.backend.core.enums.PostStatus;
import com.example.backend.core.enums.SportType;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
public class PostResponse {
    private Long id;
    private Long authorId;
    private Long fieldId;
    private String fieldName;
    private String fieldAddress;
    private String fieldImage;
    private SportType sportType;
    private PostCategory category;
    private String content;
    private PostStatus status;
    private LocalDateTime createdAt;
}
