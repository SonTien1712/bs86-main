package com.example.backend.core.repository.group;

import com.example.backend.core.entity.group.Group;

import java.util.List;
import java.util.Optional;

public interface GroupRepository {
    Group save(Group group);
    Optional<Group> findById(Long id);
    List<Group> findAllByIds(List<Long> ids);
}
