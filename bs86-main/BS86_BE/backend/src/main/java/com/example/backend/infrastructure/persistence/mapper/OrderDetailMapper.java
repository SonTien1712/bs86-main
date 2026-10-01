package com.example.backend.infrastructure.persistence.mapper;

import com.example.backend.core.entity.OrderDetail;
import com.example.backend.infrastructure.persistence.jpa.entity.OrderDetailEntity;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface OrderDetailMapper {
    @Mapping(target = "order", ignore = true)
    OrderDetail toDomain(OrderDetailEntity entity);

    @Mapping(target = "order", ignore = true)
    OrderDetailEntity toEntity(OrderDetail domain);
}
