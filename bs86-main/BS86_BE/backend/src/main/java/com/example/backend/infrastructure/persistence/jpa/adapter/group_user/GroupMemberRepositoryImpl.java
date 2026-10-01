package com.example.backend.infrastructure.persistence.jpa.adapter.group_user;

import com.example.backend.core.entity.group.GroupMember;
import com.example.backend.core.enums.groups.GroupMemberStatus;
import com.example.backend.core.repository.group.GroupMemberRepository;
import com.example.backend.infrastructure.persistence.mapper.GroupMemberPersistenceMapper;
import com.example.backend.infrastructure.persistence.jpa.repository.group_user.SpringDataGroupMemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class GroupMemberRepositoryImpl implements GroupMemberRepository {

    private final SpringDataGroupMemberRepository repository;
    private final GroupMemberPersistenceMapper mapper;

    @Override
    public GroupMember save(GroupMember member) {
        return mapper.toDomain(repository.save(mapper.toEntity(member)));
    }

    @Override
    public Optional<GroupMember> findByGroupIdAndUserId(Long groupId, Long userId) {
        return repository.findByGroupIdAndUserId(groupId, userId)
                .map(mapper::toDomain);
    }

    @Override
    public List<GroupMember> findByUserIdAndStatus(Long userId, GroupMemberStatus status) {
        return repository.findByUserIdAndStatus(userId, status).stream()
                .map(mapper::toDomain)
                .toList();
    }

    @Override
    public List<GroupMember> findByGroupIdAndStatus(Long groupId, GroupMemberStatus status) {
        return repository.findByGroupIdAndStatus(groupId, status).stream()
                .map(mapper::toDomain)
                .toList();
    }

    @Override
    public long countByGroupIdAndStatus(Long groupId, GroupMemberStatus status) {
        return repository.countByGroupIdAndStatus(groupId, status);
    }
}
