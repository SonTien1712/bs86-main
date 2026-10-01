package com.example.backend.infrastructure.persistence.mapper;

import com.example.backend.core.entity.Otp;
import com.example.backend.infrastructure.persistence.jpa.entity.OtpEntity;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface OtpMapper {
    Otp toDomain(OtpEntity entity);
    OtpEntity toEntity(Otp domain);
}
