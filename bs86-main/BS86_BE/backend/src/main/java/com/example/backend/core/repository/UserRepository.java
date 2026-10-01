package com.example.backend.core.repository;

import com.example.backend.core.entity.User;
import com.example.backend.core.enums.Role;
import com.example.backend.core.enums.UserStatus;

import java.util.List;
import java.util.Optional;

public interface UserRepository {
    User save(User user);

    Optional<User> findById(Long id);

    List<User> findAll();

    void deleteById(Long id);

    Optional<User> findByEmail(String email);

    Optional<User> findByProviderAndProviderId(String provider, String providerId);

    List<User> findAllByRole(Role role);

    boolean existsByEmail(String email);

    long countByStatus(UserStatus status);

    long countOwners();

    long count();
}
