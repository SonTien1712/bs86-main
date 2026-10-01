package com.example.backend.core.entity.group;

import com.example.backend.core.enums.groups.MessageType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GroupMessage {
    private Long id;
    private Long groupId;
    private Long senderId;
    private String content;
    private MessageType messageType;
    private LocalDateTime createdAt;
}
