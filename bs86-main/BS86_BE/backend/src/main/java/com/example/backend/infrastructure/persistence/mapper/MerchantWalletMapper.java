package com.example.backend.infrastructure.persistence.mapper;

import com.example.backend.core.entity.MerchantWallet;
import com.example.backend.infrastructure.persistence.jpa.entity.MerchantWalletEntity;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface MerchantWalletMapper {
    MerchantWallet toDomain(MerchantWalletEntity entity);
    MerchantWalletEntity toEntity(MerchantWallet domain);
}
