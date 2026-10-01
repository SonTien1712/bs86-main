package com.example.backend.presentation.dto.request.group;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateGroupRequest {
    private String name;
    private String description;
}
