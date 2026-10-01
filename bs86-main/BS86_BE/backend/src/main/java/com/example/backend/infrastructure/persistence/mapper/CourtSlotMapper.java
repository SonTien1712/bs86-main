package com.example.backend.infrastructure.persistence.mapper;

import com.example.backend.core.entity.CourtSlot;
import com.example.backend.infrastructure.persistence.jpa.entity.CourtSlotEntity;
import com.example.backend.presentation.dto.response.CourtSlotResponse;
import org.mapstruct.Mapper;

import java.util.List;

@Mapper(componentModel = "spring")
public interface CourtSlotMapper {

    CourtSlotResponse toResponse(CourtSlot slot);

    List<CourtSlotResponse> toResponseList(List<CourtSlot> slots);
    CourtSlot toDomain(CourtSlotEntity entity);
    CourtSlotEntity toEntity(CourtSlot domain);

}