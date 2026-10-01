package com.example.backend.infrastructure.persistence.mapper;

import com.example.backend.core.entity.group.Group;
import com.example.backend.infrastructure.persistence.jpa.entity.group_user.GroupJpaEntity;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface GroupPersistenceMapper {
    Group toDomain(GroupJpaEntity entity);
    GroupJpaEntity toEntity(Group domain);
}
