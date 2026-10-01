package com.example.backend.infrastructure.persistence.mapper;

import com.example.backend.core.entity.FieldVerification;
import com.example.backend.infrastructure.persistence.jpa.entity.FieldVerificationEntity;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface FieldVerificationMapper {
    @Mapping(target = "field", ignore = true)
    FieldVerification toDomain(FieldVerificationEntity entity);

    @Mapping(target = "field", ignore = true)
    FieldVerificationEntity toEntity(FieldVerification domain);
}
