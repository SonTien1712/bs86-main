package com.example.backend.infrastructure.persistence.mapper;

import com.example.backend.core.entity.OwnerVerification;
import com.example.backend.infrastructure.persistence.jpa.entity.OwnerVerificationEntity;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface OwnerVerificationMapper {

    @Mapping(target = "owner", ignore = true)
    OwnerVerification toDomain(OwnerVerificationEntity entity);

    @Mapping(target = "owner", ignore = true)
    OwnerVerificationEntity toEntity(OwnerVerification domain);
}