package com.example.backend.infrastructure.persistence.mapper;

import com.example.backend.core.entity.TimeSlotTemplate;
import com.example.backend.infrastructure.persistence.jpa.entity.TimeSlotTemplateEntity;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface TimeSlotTemplateMapper {

    @Mapping(target = "court", ignore = true)
    TimeSlotTemplateEntity toEntity(TimeSlotTemplate domain);

    @Mapping(target = "court", ignore = true)
    TimeSlotTemplate toDomain(TimeSlotTemplateEntity entity);
}