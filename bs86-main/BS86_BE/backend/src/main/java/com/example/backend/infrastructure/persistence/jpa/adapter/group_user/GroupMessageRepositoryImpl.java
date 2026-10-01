package com.example.backend.infrastructure.persistence.jpa.adapter.group_user;

import com.example.backend.core.entity.group.GroupMessage;
import com.example.backend.core.repository.group.GroupMessageRepository;
import com.example.backend.infrastructure.persistence.mapper.GroupMessagePersistenceMapper;
import com.example.backend.infrastructure.persistence.jpa.repository.group_user.SpringDataGroupMessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
@RequiredArgsConstructor
public class GroupMessageRepositoryImpl implements GroupMessageRepository {

    private final SpringDataGroupMessageRepository repository;
    private final GroupMessagePersistenceMapper mapper;

    @Override
    public GroupMessage save(GroupMessage message) {
        return mapper.toDomain(repository.save(mapper.toEntity(message)));
    }

    @Override
    public List<GroupMessage> findLatestMessages(Long groupId, Long beforeMessageId, int limit) {
        var pageable = PageRequest.of(0, limit);

        if (beforeMessageId == null) {
            return repository.findByGroupIdOrderByIdDesc(groupId, pageable).stream()
                    .map(mapper::toDomain)
                    .toList();
        }

        return repository.findByGroupIdAndIdLessThanOrderByIdDesc(groupId, beforeMessageId, pageable).stream()
                .map(mapper::toDomain)
                .toList();
    }
}
