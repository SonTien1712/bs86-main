package com.example.backend.infrastructure.persistence.jpa.repository.group_user;

import com.example.backend.core.enums.groups.GroupMemberStatus;
import com.example.backend.infrastructure.persistence.jpa.entity.group_user.GroupMemberJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SpringDataGroupMemberRepository extends JpaRepository<GroupMemberJpaEntity, Long> {
    Optional<GroupMemberJpaEntity> findByGroupIdAndUserId(Long groupId, Long userId);
    List<GroupMemberJpaEntity> findByUserIdAndStatus(Long userId, GroupMemberStatus status);
    List<GroupMemberJpaEntity> findByGroupIdAndStatus(Long groupId, GroupMemberStatus status);
    long countByGroupIdAndStatus(Long groupId, GroupMemberStatus status);
}
