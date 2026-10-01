package com.example.backend.infrastructure.persistence.mapper;

import com.example.backend.core.entity.Field;
import com.example.backend.core.enums.SportType;
import com.example.backend.infrastructure.persistence.jpa.entity.FieldEntity;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface FieldMapper {

    @Mapping(target = "verification.field", ignore = true)
    @Mapping(target = "detail.field", ignore = true)

    // 🔥 FIX 1: roles loop
    @Mapping(target = "owner.user.roles", ignore = true)

    // 🔥 FIX 2: verification loop (QUAN TRỌNG)
    @Mapping(target = "owner.verification.owner", ignore = true)

    FieldEntity toEntity(Field domain);


    @Mapping(target = "verification.field", ignore = true)

    // 🔥 FIX 1
    @Mapping(target = "owner.user.roles", ignore = true)

    // 🔥 FIX 2
    @Mapping(target = "owner.verification.owner", ignore = true)

    Field toDomain(FieldEntity entity);
}
