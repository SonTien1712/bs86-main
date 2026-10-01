package com.example.backend.infrastructure.persistence.mapper;

import com.example.backend.core.entity.FieldDetail;
import com.example.backend.infrastructure.persistence.jpa.entity.FieldDetailEntity;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface FieldDetailMapper {

    @Mapping(target = "fieldId", source = "field.id")
    FieldDetail toDomain(FieldDetailEntity entity);

    @Mapping(target = "field", ignore = true)
    FieldDetailEntity toEntity(FieldDetail domain);
}
