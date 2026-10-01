package com.example.backend.infrastructure.persistence.mapper;

import com.example.backend.core.entity.Court;
import com.example.backend.infrastructure.persistence.jpa.entity.CourtEntity;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface CourtMapper {
    @Mapping(target = "field", ignore = true)
    Court toDomain(CourtEntity entity);

    @Mapping(target = "field", ignore = true)
    CourtEntity toEntity(Court domain);
}
