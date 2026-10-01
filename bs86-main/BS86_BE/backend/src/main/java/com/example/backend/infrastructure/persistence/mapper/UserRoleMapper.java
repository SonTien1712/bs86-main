package com.example.backend.infrastructure.persistence.mapper;

import com.example.backend.core.entity.UserRole;
import com.example.backend.infrastructure.persistence.jpa.entity.UserRoleEntity;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface UserRoleMapper {

    @Mapping(target = "user", ignore = true)
    UserRole toDomain(UserRoleEntity entity);

    @Mapping(target = "user", ignore = true)
    UserRoleEntity toEntity(UserRole domain);
}
