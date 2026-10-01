package com.example.backend.infrastructure.persistence.jpa.repository.group_user;

import com.example.backend.infrastructure.persistence.jpa.entity.group_user.GroupJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SpringDataGroupRepository extends JpaRepository<GroupJpaEntity, Long> {
}
