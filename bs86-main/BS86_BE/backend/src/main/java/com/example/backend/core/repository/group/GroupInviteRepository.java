package com.example.backend.core.repository.group;

import com.example.backend.core.entity.group.GroupInvite;

import java.util.Optional;

public interface GroupInviteRepository {
    GroupInvite save(GroupInvite invite);
    Optional<GroupInvite> findByCode(String code);
    boolean existsByCode(String code);
}
