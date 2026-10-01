package com.example.backend.infrastructure.persistence.mapper;

import com.example.backend.core.entity.TransactionLedger;
import com.example.backend.infrastructure.persistence.jpa.entity.TransactionLedgerEntity;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface TransactionLedgerMapper {
    TransactionLedger toDomain(TransactionLedgerEntity entity);

    TransactionLedgerEntity toEntity(TransactionLedger domain);
}
