package com.example.backend.infrastructure.persistence.mapper;

import com.example.backend.core.entity.FieldReport;
import com.example.backend.infrastructure.persistence.jpa.entity.FieldReportEntity;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface FieldReportMapper {

    FieldReport toDomain(FieldReportEntity entity);

    FieldReportEntity toEntity(FieldReport domain);
}
