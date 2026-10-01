package com.example.backend.infrastructure.persistence.mapper;

import com.example.backend.core.entity.OwnerProfile;
import com.example.backend.infrastructure.persistence.jpa.entity.OwnerProfileEntity;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring", uses = { UserMapper.class, OwnerVerificationMapper.class })
public interface OwnerProfileMapper {
    OwnerProfile toDomain(OwnerProfileEntity entity);

    OwnerProfileEntity toEntity(OwnerProfile domain);
}