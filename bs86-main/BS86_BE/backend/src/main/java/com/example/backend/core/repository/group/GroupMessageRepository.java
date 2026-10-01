package com.example.backend.core.repository.group;

import com.example.backend.core.entity.group.GroupMessage;

import java.util.List;

public interface GroupMessageRepository {
    GroupMessage save(GroupMessage message);
    List<GroupMessage> findLatestMessages(Long groupId, Long beforeMessageId, int limit);
}
