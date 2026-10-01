package com.example.backend.infrastructure.persistence.mapper;

import com.example.backend.core.entity.SlotPriceOverride;
import com.example.backend.infrastructure.persistence.jpa.entity.SlotPriceOverrideEntity;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface SlotPriceOverrideMapper {

    @Mapping(target = "courtId", source = "court.id")
    SlotPriceOverride toDomain(SlotPriceOverrideEntity entity);

    @Mapping(target = "court", ignore = true) // 🔥
    SlotPriceOverrideEntity toEntity(SlotPriceOverride domain);
}
