package com.example.backend.presentation.dto.request;

import com.example.backend.core.enums.PostCategory;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreatePostRequest {
    private Long fieldId;
    private PostCategory category;
    private String content;
}
