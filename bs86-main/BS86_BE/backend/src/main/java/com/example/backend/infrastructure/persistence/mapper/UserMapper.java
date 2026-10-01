package com.example.backend.infrastructure.persistence.mapper;

import com.example.backend.core.entity.User;
import com.example.backend.infrastructure.persistence.jpa.entity.UserEntity;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring", uses = { UserRoleMapper.class })
public interface UserMapper {
    @Mapping(target = "ownerProfile.user", ignore = true)
    User toDomain(UserEntity entity);

    UserEntity toEntity(User domain);
}
