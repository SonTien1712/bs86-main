package com.example.backend.infrastructure.persistence.mapper;

import com.example.backend.core.entity.Transaction;
import com.example.backend.infrastructure.persistence.jpa.entity.TransactionEntity;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface TransactionMapper {
    @Mapping(target = "booking", ignore = true)
    Transaction toDomain(TransactionEntity entity);

    @Mapping(target = "booking", ignore = true)
    TransactionEntity toEntity(Transaction domain);
}
