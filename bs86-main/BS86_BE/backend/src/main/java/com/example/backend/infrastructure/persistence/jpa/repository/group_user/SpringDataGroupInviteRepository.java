package com.example.backend.infrastructure.persistence.jpa.repository.group_user;

import com.example.backend.infrastructure.persistence.jpa.entity.group_user.GroupInviteJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SpringDataGroupInviteRepository extends JpaRepository<GroupInviteJpaEntity, Long> {
    Optional<GroupInviteJpaEntity> findByCode(String code);
    boolean existsByCode(String code);
}
