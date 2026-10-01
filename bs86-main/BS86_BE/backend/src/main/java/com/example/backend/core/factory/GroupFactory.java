package com.example.backend.core.factory;

import com.example.backend.core.entity.group.Group;
import com.example.backend.core.enums.groups.GroupStatus;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
public class GroupFactory {

    public Group create(String name, String description, Long leaderId) {
        LocalDateTime now = LocalDateTime.now();

        return Group.builder()
                .name(name)
                .description(description)
                .leaderId(leaderId)
                .status(GroupStatus.ACTIVE)
                .createdAt(now)
                .updatedAt(now)
                .build();
    }
}
