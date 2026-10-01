package com.example.backend.infrastructure.persistence.jpa.repository;

import com.example.backend.infrastructure.persistence.jpa.entity.OwnerProfileEntity;
import com.example.backend.infrastructure.persistence.jpa.entity.UserEntity;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface OwnerProfileJpaRepository extends JpaRepository<OwnerProfileEntity, Long> {

    Optional<OwnerProfileEntity> findByUser(UserEntity user);
    Optional<OwnerProfileEntity> findByUserId(Long userId);
    Optional<OwnerProfileEntity> findByUser_Email(String email);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select o from OwnerProfileEntity o where o.id = :id")
    Optional<OwnerProfileEntity> findByIdForUpdate(@Param("id") Long id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select o from OwnerProfileEntity o where o.user.id = :userId")
    Optional<OwnerProfileEntity> findByUserIdForUpdate(@Param("userId") Long userId);

}
