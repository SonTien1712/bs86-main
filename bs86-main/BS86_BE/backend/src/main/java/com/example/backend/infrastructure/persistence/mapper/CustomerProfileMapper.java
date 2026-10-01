package com.example.backend.infrastructure.persistence.mapper;

import com.example.backend.core.entity.CustomerProfile;
import com.example.backend.infrastructure.persistence.jpa.entity.CustomerProfileEntity;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface CustomerProfileMapper {

    @Mapping(target = "user", ignore = true)
    CustomerProfile toDomain(CustomerProfileEntity entity);

    @Mapping(target = "user", ignore = true)
    CustomerProfileEntity toEntity(CustomerProfile domain);
}