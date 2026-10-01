package com.example.backend.infrastructure.persistence.mapper;

import com.example.backend.core.entity.BankAccount;
import com.example.backend.infrastructure.persistence.jpa.entity.BankAccountEntity;
import org.mapstruct.Mapper;

import java.util.List;

@Mapper(componentModel = "spring")
public interface BankAccountMapper {
    BankAccount toDomain(BankAccountEntity entity);
    BankAccountEntity toEntity(BankAccount domain);
    List<BankAccount> toDomainList(List<BankAccountEntity> entities);
}
