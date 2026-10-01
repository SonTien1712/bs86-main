package com.example.backend.infrastructure.persistence.mapper;

import com.example.backend.core.entity.Order;
import com.example.backend.infrastructure.persistence.jpa.entity.OrderEntity;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring", uses = { OrderDetailMapper.class })
public interface OrderMapper {
    @Mapping(target = "orderDetails", ignore = true)
    Order toDomain(OrderEntity entity);

    @Mapping(target = "orderDetails", ignore = true)
    OrderEntity toEntity(Order domain);
}
