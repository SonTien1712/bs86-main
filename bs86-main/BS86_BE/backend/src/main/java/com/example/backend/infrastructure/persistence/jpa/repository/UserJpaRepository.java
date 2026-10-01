package com.example.backend.infrastructure.persistence.jpa.repository;

import com.example.backend.core.enums.Role;
import com.example.backend.core.enums.UserStatus;
import com.example.backend.infrastructure.persistence.jpa.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserJpaRepository extends JpaRepository<UserEntity, Long> {

    @Query("SELECT u FROM UserEntity u LEFT JOIN FETCH u.roles WHERE u.email = :email")
    Optional<UserEntity> findByEmail(String email);

    @Query("SELECT u FROM UserEntity u LEFT JOIN FETCH u.roles WHERE u.provider = :provider AND u.providerId = :providerId")
    Optional<UserEntity> findByProviderAndProviderId(String provider, String providerId);

    @Query("""
        SELECT DISTINCT u
        FROM UserEntity u
        JOIN FETCH u.roles r
        WHERE r.role = :role
    """)
    java.util.List<UserEntity> findAllByRole(Role role);

    boolean existsByEmail(String email);

    @Query("""
    SELECT COUNT(ur)
    FROM UserRoleEntity ur
    WHERE ur.role = com.example.backend.core.enums.Role.OWNER
""")
    long countOwners();

    long countByStatus(UserStatus status);
}
