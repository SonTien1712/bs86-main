package com.example.backend.core.entity;

import com.example.backend.core.enums.MediaType;
import com.example.backend.core.enums.OwnerType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Media {
    private Long id;
    private String url;
    private String publicId;
    private MediaType type;
    private OwnerType ownerType;
    private Long ownerId;
    private String folder;
    private LocalDateTime createdAt;
}
