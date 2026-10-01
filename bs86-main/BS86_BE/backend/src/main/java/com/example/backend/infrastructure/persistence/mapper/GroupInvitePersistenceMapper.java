package com.example.backend.infrastructure.persistence.mapper;

import com.example.backend.core.entity.group.GroupInvite;
import com.example.backend.infrastructure.persistence.jpa.entity.group_user.GroupInviteJpaEntity;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface GroupInvitePersistenceMapper {
    GroupInvite toDomain(GroupInviteJpaEntity entity);
    GroupInviteJpaEntity toEntity(GroupInvite domain);
}
