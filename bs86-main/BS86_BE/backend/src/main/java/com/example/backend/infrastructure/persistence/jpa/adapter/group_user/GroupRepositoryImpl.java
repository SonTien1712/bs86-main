package com.example.backend.infrastructure.persistence.jpa.adapter.group_user;

import com.example.backend.core.entity.group.Group;
import com.example.backend.core.repository.group.GroupRepository;
import com.example.backend.infrastructure.persistence.mapper.GroupPersistenceMapper;
import com.example.backend.infrastructure.persistence.jpa.repository.group_user.SpringDataGroupRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class GroupRepositoryImpl implements GroupRepository {

    private final SpringDataGroupRepository repository;
    private final GroupPersistenceMapper mapper;

    @Override
    public Group save(Group group) {
        return mapper.toDomain(repository.save(mapper.toEntity(group)));
    }

    @Override
    public Optional<Group> findById(Long id) {
        return repository.findById(id).map(mapper::toDomain);
    }

    @Override
    public List<Group> findAllByIds(List<Long> ids) {
        return repository.findAllById(ids).stream()
                .map(mapper::toDomain)
                .toList();
    }
}
