package com.example.backend.infrastructure.persistence.mapper;

import com.example.backend.core.entity.group.GroupMessage;
import com.example.backend.infrastructure.persistence.jpa.entity.group_user.GroupMessageJpaEntity;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface GroupMessagePersistenceMapper {
    GroupMessage toDomain(GroupMessageJpaEntity entity);
    GroupMessageJpaEntity toEntity(GroupMessage domain);
}
