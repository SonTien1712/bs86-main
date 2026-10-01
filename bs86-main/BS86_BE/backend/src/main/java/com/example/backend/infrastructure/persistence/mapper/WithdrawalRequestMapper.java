package com.example.backend.infrastructure.persistence.mapper;

import com.example.backend.core.entity.WithdrawalRequest;
import com.example.backend.infrastructure.persistence.jpa.entity.WithdrawalRequestEntity;
import org.mapstruct.Mapper;

import java.util.List;

@Mapper(componentModel = "spring")
public interface WithdrawalRequestMapper {
    WithdrawalRequest toDomain(WithdrawalRequestEntity entity);
    WithdrawalRequestEntity toEntity(WithdrawalRequest domain);
    List<WithdrawalRequest> toDomainList(List<WithdrawalRequestEntity> entities);
}
