package com.example.backend.core.repository;

import com.example.backend.core.entity.CustomerProfile;
import java.util.Optional;

public interface CustomerProfileRepository {
    CustomerProfile save(CustomerProfile profile);

    Optional<CustomerProfile> findById(Long id);

    Optional<CustomerProfile> findByUserId(Long userId);
}
