package com.example.backend.infrastructure.persistence.jpa.adapter.group_user;

import com.example.backend.core.entity.group.GroupInvite;
import com.example.backend.core.repository.group.GroupInviteRepository;
import com.example.backend.infrastructure.persistence.mapper.GroupInvitePersistenceMapper;
import com.example.backend.infrastructure.persistence.jpa.repository.group_user.SpringDataGroupInviteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class GroupInviteRepositoryImpl implements GroupInviteRepository {

    private final SpringDataGroupInviteRepository repository;
    private final GroupInvitePersistenceMapper mapper;

    @Override
    public GroupInvite save(GroupInvite invite) {
        return mapper.toDomain(repository.save(mapper.toEntity(invite)));
    }

    @Override
    public Optional<GroupInvite> findByCode(String code) {
        return repository.findByCode(code).map(mapper::toDomain);
    }

    @Override
    public boolean existsByCode(String code) {
        return repository.existsByCode(code);
    }
}
