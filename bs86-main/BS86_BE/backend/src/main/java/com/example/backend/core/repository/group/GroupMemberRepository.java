package com.example.backend.core.repository.group;

import com.example.backend.core.entity.group.GroupMember;
import com.example.backend.core.enums.groups.GroupMemberStatus;

import java.util.List;
import java.util.Optional;

public interface GroupMemberRepository {
    GroupMember save(GroupMember member);
    Optional<GroupMember> findByGroupIdAndUserId(Long groupId, Long userId);
    List<GroupMember> findByUserIdAndStatus(Long userId, GroupMemberStatus status);
    List<GroupMember> findByGroupIdAndStatus(Long groupId, GroupMemberStatus status);
    long countByGroupIdAndStatus(Long groupId, GroupMemberStatus status);
}
