package com.example.backend.infrastructure.persistence.mapper;

import com.example.backend.core.entity.group.GroupMember;
import com.example.backend.infrastructure.persistence.jpa.entity.group_user.GroupMemberJpaEntity;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface GroupMemberPersistenceMapper {
    GroupMember toDomain(GroupMemberJpaEntity entity);
    GroupMemberJpaEntity toEntity(GroupMember domain);
}
