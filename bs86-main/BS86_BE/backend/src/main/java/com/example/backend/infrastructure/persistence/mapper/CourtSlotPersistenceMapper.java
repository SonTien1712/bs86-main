package com.example.backend.infrastructure.persistence.mapper;

import com.example.backend.core.entity.CourtSlot;
import com.example.backend.infrastructure.persistence.jpa.entity.CourtSlotEntity;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring", uses = {CourtMapper.class})
public interface CourtSlotPersistenceMapper {

    @Mapping(target = "courtId", source = "court.id")
    CourtSlot toDomain(CourtSlotEntity entity);

    @Mapping(target = "court", ignore = true) // 🔥 QUAN TRỌNG
    CourtSlotEntity toEntity(CourtSlot domain);

    List<CourtSlot> toDomainList(List<CourtSlotEntity> entities);
}