package com.example.backend.core.entity;

import com.example.backend.core.enums.PostCategory;
import com.example.backend.core.enums.PostStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Post {
    private Long id;
    private Long authorId;
    private Long fieldId;
    private PostCategory category;
    private String content;
    private PostStatus status;
    private LocalDateTime createdAt;
}
